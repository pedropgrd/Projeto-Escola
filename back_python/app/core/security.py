"""
Módulo de Segurança - JWT e Autenticação
Usando PyJWT para tokens simples e seguros
Usando bcrypt diretamente para hash de senhas
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
import jwt
import bcrypt

from app.core.config import settings
from app.database.session import get_session
from app.models.user import User


# ==================== CONFIGURAÇÕES ====================

# Security scheme para Bearer Token
security = HTTPBearer(
    scheme_name="Bearer Token",
    description="Insira o access_token obtido no login"
)


# ==================== FUNÇÕES DE SENHA ====================

def get_password_hash(password: str) -> str:
    """
    Hash de senha usando bcrypt diretamente
    Limita a 72 bytes para evitar erro do bcrypt
    """
    # Bcrypt tem limite de 72 bytes
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Gerar hash com bcrypt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha corresponde ao hash usando bcrypt diretamente
    """
    try:
        # Bcrypt tem limite de 72 bytes
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        
        # Verificar hash com bcrypt
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# ==================== FUNÇÕES JWT ====================

def create_access_token(
    user_id: int,
    email: str,
    perfil: str
) -> str:
    """
    Cria um access token JWT com informações do usuário (scopes)
    
    Payload do token:
    - sub: ID do usuário
    - email: E-mail do usuário
    - perfil: Role (ADMIN, PROFESSOR, ALUNO)
    - iat: Data/hora de criação (issued at)
    - exp: Data/hora de expiração
    - type: Tipo do token (access)
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Use timestamps inteiros para iat/exp (compatibilidade e validação)
    iat = int(now.timestamp())
    exp = int(expire.timestamp())

    payload = {
        "sub": str(user_id),           # Subject (ID do usuário)
        "email": email,                 # E-mail
        "perfil": perfil,               # Role/Perfil
        "iat": iat,                     # Issued at (unix timestamp)
        "exp": exp,                     # Expiration time (unix timestamp)
        "type": "access"              # Tipo do token
    }

    # Codifica o token usando PyJWT. Algumas versões retornam 'bytes'.
    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    # Garantir que retornamos uma str (compatibilidade PyJWT v1/v2)
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return token


def create_refresh_token(user_id: int) -> str:
    """
    Cria um refresh token JWT (apenas com ID do usuário)
    """
    now = datetime.now(timezone.utc)
    # Usar horas para expiração do refresh token
    expire = now + timedelta(hours=settings.REFRESH_TOKEN_EXPIRE_HOURS)

    iat = int(now.timestamp())
    exp = int(expire.timestamp())

    payload = {
        "sub": str(user_id),
        "iat": iat,
        "exp": exp,
        "type": "refresh"
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return token


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodifica e valida um token JWT
    
    Raises:
        HTTPException: Se o token for inválido ou expirado
    """
    try:
        # Decodifica e valida o token; PyJWT lançará exceções específicas em caso de
        # token expirado ou inválido.
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado. Faça login novamente ou use o refresh token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    except jwt.InvalidTokenError:
        # Fornece uma mensagem um pouco mais instrutiva para depuração local
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido. Verifique se o token está completo e foi gerado com a mesma SECRET_KEY.",
            headers={"WWW-Authenticate": "Bearer"}
        )


# ==================== DEPENDÊNCIAS DE AUTENTICAÇÃO ====================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session)
) -> User:
    """
    Dependência que extrai e valida o usuário atual do token JWT
    
    Fluxo:
    1. Extrai o token do header Authorization: Bearer <token>
    2. Decodifica e valida o token
    3. Busca o usuário no banco de dados
    4. Verifica se o usuário está ativo
    5. Retorna o objeto User completo
    """
    # Extrai o token do header
    token = credentials.credentials
    
    # Decodifica o token
    payload = decode_token(token)
    
    # Valida o tipo do token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de token inválido. Use um access token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Extrai o ID do usuário
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: ID do usuário não encontrado.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Busca o usuário no banco
    statement = select(User).where(User.id == int(user_id))
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verifica se o usuário está ativo
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Entre em contato com o administrador."
        )
    
    return user


async def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependência que verifica se o usuário atual é ADMIN
    """
    if current_user.perfil.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem realizar esta ação."
        )
    return current_user


def require_role(*allowed_roles: str):
    """
    Factory de dependência que verifica se o usuário tem um dos perfis permitidos
    
    Uso:
        @router.get("/rota")
        async def minha_rota(
            current_user: User = Depends(require_role("ADMIN", "PROFESSOR"))
        ):
            # Apenas ADMIN e PROFESSOR podem acessar
    
    Args:
        *allowed_roles: Perfis permitidos (ADMIN, PROFESSOR, ALUNO, SERVIDOR)
    
    Returns:
        Função de dependência do FastAPI
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.perfil.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Perfis permitidos: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def verify_api_key(api_key: str) -> bool:
    """
    Verifica se a API Key é válida
    Útil para integrações externas
    """
    return api_key == settings.API_KEY

