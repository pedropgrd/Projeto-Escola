from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
import jwt

from app.database.session import get_session
from app.schemas.auth import Token, LoginRequest, TokenRefresh, TokenData
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_active_admin,
    get_current_user,
    decode_token
)
from app.core.config import settings


router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def sign_up(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_admin)
):
    """
    ## Registro de novo usuário (Sign-up) - APENAS ADMIN
    
    Cria um novo usuário no sistema. **Apenas administradores podem criar contas.**
    
    Validações:
    - E-mail único
    - Senha forte (mínimo 6 caracteres, com letras e números)
    - Hash da senha com bcrypt
    
    **Autorização:** Requer perfil ADMIN.
    """
    # Verifica se o e-mail já existe
    statement = select(User).where(User.email == user_data.email)
    result = await session.execute(statement)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já cadastrado no sistema"
        )
    
    # Cria o usuário com senha hasheada
    senha_hash = get_password_hash(user_data.senha)
    
    new_user = User(
        email=user_data.email,
        nome_completo=user_data.nome_completo,
        perfil=user_data.perfil,
        senha_hash=senha_hash,
        ativo=True
    )
    
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    ## Autenticação de usuário (Login)
    
    Valida credenciais e retorna tokens JWT:
    - **access_token**: Token de curta duração (30 min) para acessar recursos
    - **refresh_token**: Token de longa duração (4 horas) para renovar o access_token
    
    **Segurança:**
    - Verifica se o usuário está ativo (is_active=True)
    - Compara o hash da senha com bcrypt
    """
    # Busca o usuário por e-mail
    statement = select(User).where(User.email == login_data.email)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    # Valida credenciais
    if not user or not verify_password(login_data.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verifica se o usuário está ativo
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Entre em contato com o administrador."
        )
    
    # Gera os tokens JWT com informações do usuário
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        nome_completo=user.nome_completo,
        perfil=user.perfil.value  # Converte Enum para string
    )
    refresh_token = create_refresh_token(user_id=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: TokenRefresh,
    session: AsyncSession = Depends(get_session)
):
    """
    ## Renovação de Token (Refresh)
    
    Permite renovar o access_token usando um refresh_token válido.
    
    **Fluxo:**
    1. Cliente envia o refresh_token
    2. Sistema valida o token
    3. Retorna novo access_token e refresh_token
    
    **Segurança:** Apenas tokens do tipo "refresh" são aceitos.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar o refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodifica o refresh token usando a função centralizada
        payload = decode_token(token_data.refresh_token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "refresh":
            raise credentials_exception
            
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise credentials_exception
    
    # Verifica se o usuário existe e está ativo
    statement = select(User).where(User.id == int(user_id))
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user or not user.ativo:
        raise credentials_exception
    
    # Gera novos tokens com informações atualizadas do usuário
    new_access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        nome_completo=user.nome_completo,
        perfil=user.perfil.value
    )
    new_refresh_token = create_refresh_token(user_id=user.id)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me/token", response_model=TokenData)
async def get_token_info(
    current_user: User = Depends(get_current_user)
):
    """
    ## Informações do Token (Scopes)
    
    Decodifica o token JWT e retorna as informações contidas nele:
    - **user_id**: ID do usuário
    - **email**: E-mail do usuário  
    - **nome**: Nome completo do usuário
    - **perfil**: Role/Perfil (ADMIN, PROFESSOR, ALUNO)
    - **data_acesso**: Data e hora em que o token foi criado
    
    **Autenticação:** Requer token JWT válido.
    **Uso:** Envie o token no header `Authorization: Bearer <seu_token>`
    """
    return TokenData(
        user_id=current_user.id,
        email=current_user.email,
        nome=current_user.nome_completo,
        perfil=current_user.perfil.value,
        data_acesso=current_user.criado_em
    )


