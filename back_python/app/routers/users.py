from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.database.session import get_session
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.security import get_current_user, require_role


router = APIRouter(prefix="/users", tags=["Usuários"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    ## Obter informações do usuário autenticado
    
    Retorna os dados do usuário logado baseado no token JWT.
    
    **Autenticação:** Requer token JWT válido.
    """
    return current_user


@router.get("/admin-only", response_model=dict)
async def admin_only_route(
    current_user: User = Depends(require_role("ADMIN"))
):
    """
    ## Rota protegida - Apenas ADMIN
    
    Esta é uma rota de exemplo que demonstra a proteção por role.
    Apenas usuários com perfil ADMIN podem acessar.
    
    **Autorização:** Requer role ADMIN.
    """
    nome_exibicao = current_user.cpf if current_user.cpf else current_user.email
    return {
        "message": f"Bem-vindo, {nome_exibicao}!",
        "detail": "Você tem acesso total ao sistema como ADMIN",
        "admin_permissions": [
            "Gerenciar usuários",
            "Visualizar relatórios",
            "Configurar sistema"
        ]
    }


@router.get("/", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ADMIN"))
):
    """
    ## Listar todos os usuários
    
    Lista todos os usuários cadastrados no sistema (apenas ativos).
    
    **Autorização:** Requer role ADMIN.
    **Paginação:** Use skip e limit para paginar os resultados.
    """
    statement = select(User).where(User.ativo == True).offset(skip).limit(limit)
    result = await session.execute(statement)
    users = result.scalars().all()
    
    return users


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def soft_delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ADMIN"))
):
    """
    ## Desativar usuário (Soft Delete)
    
    Implementa soft delete: marca o usuário como inativo (ativo=False)
    ao invés de deletar permanentemente.
    
    **Importante:** Dados históricos são preservados.
    **Autorização:** Requer role ADMIN.
    """
    statement = select(User).where(User.id == user_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Soft delete
    user.ativo = False
    session.add(user)
    await session.commit()
    
    return None
