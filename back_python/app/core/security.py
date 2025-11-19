from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.database.session import get_session
from app.models.user import User
from sqlmodel import select


# Configuração do bcrypt para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme simplificado - apenas Bearer token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=True
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha corresponde ao hash"""
    # Trunca a senha para 72 bytes (limite do bcrypt)
    return pwd_context.verify(plain_password[:72], hashed_password)


def get_password_hash(password: str) -> str:
    """
    Gera o hash da senha usando bcrypt
    
    Nota: bcrypt tem um limite de 72 bytes para senhas.
    Senhas maiores são automaticamente truncadas.
    """
    # Trunca a senha para 72 bytes (limite do bcrypt)
    return pwd_context.hash(password[:72])


def create_access_token(
    user_id: int,
    email: str,
    nome_completo: str,
    perfil: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Cria um token JWT de acesso com informações do usuário
    
    Args:
        user_id: ID do usuário
        email: E-mail do usuário
        nome_completo: Nome completo do usuário
        perfil: Perfil/Role do usuário (ADMIN, PROFESSOR, ALUNO)
        expires_delta: Tempo de expiração customizado
        
    Returns:
        Token JWT contendo:
        - sub: ID do usuário
        - email: E-mail do usuário
        - nome: Nome completo do usuário
        - perfil: Role do usuário
        - iat: Data/hora de criação (issued at)
        - exp: Data/hora de expiração
        - type: Tipo do token (access)
    """
    now = datetime.utcnow()
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # Dados que vão no token (scopes)
    to_encode = {
        "sub": str(user_id),  # Subject (ID do usuário)
        "email": email,
        "nome": nome_completo,
        "perfil": perfil,
        "iat": now,  # Issued at (data de acesso)
        "exp": expire,  # Expiration time
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(user_id: int) -> str:
    """
    Cria um token JWT de refresh (vida longa) para renovar o access token
    
    Args:
        user_id: ID do usuário
        
    Returns:
        Token JWT contendo apenas:
        - sub: ID do usuário
        - exp: Data/hora de expiração (7 dias)
        - type: Tipo do token (refresh)
    """
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session)
) -> User:
    """
    Dependência que valida o token JWT e retorna o usuário atual
    
    Raises:
        HTTPException: Se o token for inválido ou o usuário não existir
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodifica o token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Busca o usuário no banco
    statement = select(User).where(User.id == int(user_id))
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    # Verifica se o usuário está ativo
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    return user


def require_role(required_role: str):
    """
    Dependência de autorização que verifica se o usuário tem a role necessária
    
    Args:
        required_role: Role necessária (ex: "ADMIN", "PROFESSOR")
    
    Returns:
        Função de dependência para ser usada em rotas
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.perfil != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Apenas {required_role} pode acessar este recurso"
            )
        return current_user
    
    return role_checker
