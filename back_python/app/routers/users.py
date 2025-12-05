from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.database.session import get_session
from app.models.user import User
from app.schemas.user import UserResponse, UserPasswordUpdate
from app.core.security import get_current_user, require_role, verify_password, get_password_hash


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


@router.put("/me/password", response_model=dict)
async def change_password(
    password_data: UserPasswordUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    ## Alterar senha do usuário autenticado
    
    Permite que o usuário logado altere sua própria senha.
    
    **Requisitos:**
    - Senha atual correta
    - Nova senha com no mínimo 6 caracteres
    - Nova senha deve conter letras e números
    
    **Autenticação:** Requer token JWT válido.
    """
    # Verificar senha atual
    if not verify_password(password_data.senha_atual, current_user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta"
        )
    
    # Verificar se a nova senha é diferente da atual
    if verify_password(password_data.senha_nova, current_user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha não pode ser igual à senha atual"
        )
    
    # Atualizar senha
    current_user.senha_hash = get_password_hash(password_data.senha_nova)
    session.add(current_user)
    await session.commit()
    
    return {
        "message": "Senha alterada com sucesso",
        "detail": "Sua senha foi atualizada. Use a nova senha no próximo login."
    }


@router.put("/{user_id}/password", response_model=dict)
async def admin_change_user_password(
    user_id: int,
    nova_senha: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ADMIN"))
):
    """
    ## Alterar senha de qualquer usuário (ADMIN)
    
    Permite que um administrador altere a senha de qualquer usuário do sistema.
    Não requer a senha atual do usuário alvo.
    
    **Requisitos:**
    - Nova senha com no mínimo 6 caracteres
    - Nova senha deve conter letras e números
    
    **Autorização:** Requer role ADMIN.
    """
    # Validar nova senha
    if len(nova_senha) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve ter no mínimo 6 caracteres"
        )
    if len(nova_senha) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve ter no máximo 72 caracteres (limite do bcrypt)"
        )
    if not any(char.isdigit() for char in nova_senha):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve conter pelo menos um número"
        )
    if not any(char.isalpha() for char in nova_senha):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve conter pelo menos uma letra"
        )
    
    # Buscar usuário alvo
    statement = select(User).where(User.id == user_id, User.ativo == True)
    result = await session.execute(statement)
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado ou inativo"
        )
    
    # Atualizar senha
    target_user.senha_hash = get_password_hash(nova_senha)
    session.add(target_user)
    await session.commit()
    
    usuario_alvo = target_user.cpf if target_user.cpf else target_user.email
    admin_nome = current_user.cpf if current_user.cpf else current_user.email
    
    return {
        "message": "Senha alterada com sucesso pelo administrador",
        "detail": f"Senha do usuário {usuario_alvo} foi redefinida por {admin_nome}",
        "user_id": user_id
    }


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
