from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_session
from app.models.professor import Professor
from app.models.user import User, UserRole
from app.schemas.professor import (
    ProfessorCreate,
    ProfessorUpdate,
    ProfessorResponse,
    ProfessorListResponse,
    VincularUsuarioCreate,
    VincularUsuarioExistente
)
from app.core.security import get_current_user, get_password_hash

router = APIRouter(prefix="/professores", tags=["Professores"])


@router.post(
    "/",
    response_model=ProfessorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo professor"
)
async def create_professor(
    professor_data: ProfessorCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Criar novo professor no sistema.
    
    **Mudança Arquitetural**: Agora cria apenas o registro do professor,
    SEM vincular usuário automaticamente. Para criar acesso de login,
    use o endpoint POST /professores/{professor_id}/vincular-usuario
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem criar professores"
        )
    
    # Verificar se já existe professor com este CPF
    result = await session.execute(
        select(Professor).where(
            Professor.cpf == professor_data.cpf,
            Professor.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um professor com este CPF"
        )
    
    # Criar o professor (sem usuário vinculado)
    professor = Professor(**professor_data.model_dump())
    session.add(professor)
    await session.commit()
    await session.refresh(professor)
    
    # Preparar resposta com email_usuario como None
    professor_response = ProfessorResponse(
        **professor.model_dump(),
        email_usuario=None
    )
    
    return professor_response


@router.get(
    "/",
    response_model=ProfessorListResponse,
    summary="Listar professores com paginação"
)
async def list_professores(
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar professores do sistema com paginação.
    
    **Permissão**: ADMIN e PROFESSOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso"
        )
    
    # Construir query base (apenas registros não deletados)
    query = select(Professor).where(Professor.is_deleted == False)
    
    # Contar total
    count_query = select(func.count()).select_from(Professor).where(
        Professor.is_deleted == False
    )
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Buscar registros com paginação
    query = query.offset(offset).limit(limit).order_by(Professor.id_professor)
    result = await session.execute(query)
    professores = result.scalars().all()
    
    # Enriquecer com email do usuário quando existir
    professores_response = []
    for professor in professores:
        email_usuario = None
        if professor.id_usuario:
            user_result = await session.execute(
                select(User).where(User.id == professor.id_usuario)
            )
            usuario = user_result.scalar_one_or_none()
            if usuario:
                email_usuario = usuario.email
        
        professores_response.append(
            ProfessorResponse(
                **professor.model_dump(),
                email_usuario=email_usuario
            )
        )
    
    return ProfessorListResponse(
        items=professores_response,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/buscar",
    response_model=ProfessorResponse,
    summary="Buscar professor por ID, CPF ou nome"
)
async def get_professor(
    professor_id: int = Query(None, description="ID do professor"),
    cpf: str = Query(None, description="CPF do professor"),
    nome: str = Query(None, description="Nome do professor (busca parcial)"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar professor por ID, CPF ou nome.
    
    **Parâmetros de busca** (forneça pelo menos um):
    - **professor_id**: Busca exata por ID
    - **cpf**: Busca exata por CPF
    - **nome**: Busca parcial por nome (LIKE)
    
    **Permissão**: ADMIN e PROFESSOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso"
        )
    
    # Validar que pelo menos um parâmetro foi fornecido
    if not professor_id and not cpf and not nome:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forneça pelo menos um parâmetro: professor_id, cpf ou nome"
        )
    
    # Construir query base
    query = select(Professor).where(Professor.is_deleted == False)
    
    # Aplicar filtros conforme parâmetros fornecidos
    if professor_id:
        query = query.where(Professor.id_professor == professor_id)
    if cpf:
        query = query.where(Professor.cpf == cpf)
    if nome:
        query = query.where(Professor.nome.ilike(f"%{nome}%"))
    
    # Executar busca
    result = await session.execute(query)
    professor = result.scalar_one_or_none()
    
    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado"
        )
    
    # Buscar email do usuário se existir vinculação
    email_usuario = None
    if professor.id_usuario:
        user_result = await session.execute(
            select(User).where(User.id == professor.id_usuario)
        )
        usuario = user_result.scalar_one_or_none()
        if usuario:
            email_usuario = usuario.email
    
    return ProfessorResponse(
        **professor.model_dump(),
        email_usuario=email_usuario
    )


@router.get(
    "/{professor_id}",
    response_model=ProfessorResponse,
    summary="Buscar professor por ID (compatibilidade)"
)
async def get_professor_by_id(
    professor_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar professor por ID (endpoint de compatibilidade).
    
    **Permissão**: ADMIN e PROFESSOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso"
        )
    
    # Buscar professor
    result = await session.execute(
        select(Professor).where(
            Professor.id_professor == professor_id,
            Professor.is_deleted == False
        )
    )
    professor = result.scalar_one_or_none()
    
    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado"
        )
    
    # Buscar email do usuário se existir vinculação
    email_usuario = None
    if professor.id_usuario:
        user_result = await session.execute(
            select(User).where(User.id == professor.id_usuario)
        )
        usuario = user_result.scalar_one_or_none()
        if usuario:
            email_usuario = usuario.email
    
    return ProfessorResponse(
        **professor.model_dump(),
        email_usuario=email_usuario
    )


@router.put(
    "/{professor_id}",
    response_model=ProfessorResponse,
    summary="Atualizar professor"
)
async def update_professor(
    professor_id: int,
    professor_data: ProfessorUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar dados do professor.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem atualizar professores"
        )
    
    # Buscar professor
    result = await session.execute(
        select(Professor).where(
            Professor.id_professor == professor_id,
            Professor.is_deleted == False
        )
    )
    professor = result.scalar_one_or_none()
    
    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado"
        )
    
    # Verificar CPF duplicado (se estiver sendo atualizado)
    if professor_data.cpf and professor_data.cpf != professor.cpf:
        result = await session.execute(
            select(Professor).where(
                Professor.cpf == professor_data.cpf,
                Professor.is_deleted == False,
                Professor.id_professor != professor_id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um professor com este CPF"
            )
    
    # Atualizar campos
    update_data = professor_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(professor, field, value)
    
    professor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(professor)
    
    # Buscar email do usuário se existir vinculação
    email_usuario = None
    if professor.id_usuario:
        user_result = await session.execute(
            select(User).where(User.id == professor.id_usuario)
        )
        usuario = user_result.scalar_one_or_none()
        if usuario:
            email_usuario = usuario.email
    
    return ProfessorResponse(
        **professor.model_dump(),
        email_usuario=email_usuario
    )


@router.delete(
    "/{professor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar professor (soft delete)"
)
async def delete_professor(
    professor_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar professor do sistema (Soft Delete).
    
    **Atenção**: Esta operação NÃO remove o registro do banco de dados,
    apenas marca como deletado (is_deleted = True).
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem deletar professores"
        )
    
    # Buscar professor
    result = await session.execute(
        select(Professor).where(
            Professor.id_professor == professor_id,
            Professor.is_deleted == False
        )
    )
    professor = result.scalar_one_or_none()
    
    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado"
        )
    
    # Soft delete
    professor.is_deleted = True
    professor.deleted_at = datetime.utcnow()
    professor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    
    return None


# ============================================
# ENDPOINTS DE VINCULAÇÃO DE USUÁRIO
# ============================================

@router.post(
    "/{professor_id}/vincular-usuario",
    response_model=ProfessorResponse,
    status_code=status.HTTP_200_OK,
    summary="Criar e vincular usuário para professor"
)
async def vincular_usuario_professor(
    professor_id: int,
    usuario_data: VincularUsuarioCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Criar um novo usuário e vincular a um professor existente.
    
    Permite que um professor (cadastrado como pessoa) receba acesso ao sistema.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem vincular usuários"
        )
    
    # Buscar professor
    result = await session.execute(
        select(Professor).where(
            Professor.id_professor == professor_id,
            Professor.is_deleted == False
        )
    )
    professor = result.scalar_one_or_none()
    
    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado"
        )
    
    # Verificar se professor já tem usuário vinculado
    if professor.id_usuario is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este professor já possui um usuário vinculado"
        )
        
    if not usuario_data.cpf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF é obrigatório para criar o usuário do aluno"
        )
    
     # Validar nova senha
    if len(usuario_data.senha) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve ter no mínimo 6 caracteres"
        )
    if len(usuario_data.senha) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve ter no máximo 72 caracteres (limite do bcrypt)"
        )
    if not any(char.isdigit() for char in usuario_data.senha):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve conter pelo menos um número"
        )
    if not any(char.isalpha() for char in usuario_data.senha):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve conter pelo menos uma letra"
        )
        
    # Verificar se email já está em uso
    result = await session.execute(
        select(User).where(User.email == usuario_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está em uso"
        )
    
    # Criar novo usuário
    novo_usuario = User(
        cpf=usuario_data.cpf,
        email=usuario_data.email,
        senha_hash=get_password_hash(usuario_data.senha),
        perfil=UserRole.PROFESSOR,
        ativo=True
    )
    session.add(novo_usuario)
    await session.flush()  # Gerar ID do usuário
    
    # Vincular usuário ao professor
    professor.id_usuario = novo_usuario.id
    professor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(professor)
    
    return ProfessorResponse(
        **professor.model_dump(),
        email_usuario=novo_usuario.email
    )


@router.put(
    "/{professor_id}/vincular-usuario-existente",
    response_model=ProfessorResponse,
    status_code=status.HTTP_200_OK,
    summary="Vincular usuário existente a professor"
)
async def vincular_usuario_existente_professor(
    professor_id: int,
    vinculacao_data: VincularUsuarioExistente,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Vincular um usuário já existente a um professor.
    
    Útil quando o usuário já foi criado mas não estava associado ao professor.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem vincular usuários"
        )
    
    # Buscar professor
    result = await session.execute(
        select(Professor).where(
            Professor.id_professor == professor_id,
            Professor.is_deleted == False
        )
    )
    professor = result.scalar_one_or_none()
    
    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado"
        )
    
    # Verificar se professor já tem usuário vinculado
    if professor.id_usuario is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este professor já possui um usuário vinculado"
        )
    
    # Buscar usuário
    result = await session.execute(
        select(User).where(User.id == vinculacao_data.id_usuario)
    )
    usuario = result.scalar_one_or_none()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Verificar se usuário já está vinculado a outro professor
    result = await session.execute(
        select(Professor).where(
            Professor.id_usuario == vinculacao_data.id_usuario,
            Professor.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuário já está vinculado a outro professor"
        )
    
    # Verificar se perfil do usuário é PROFESSOR
    if usuario.perfil != UserRole.PROFESSOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O usuário deve ter perfil PROFESSOR para ser vinculado a um professor"
        )
    
    
    
    # Vincular usuário ao professor
    professor.id_usuario = usuario.id
    professor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(professor)
    
    return ProfessorResponse(
        **professor.model_dump(),
        email_usuario=usuario.email
    )


@router.delete(
    "/{professor_id}/desvincular-usuario",
    response_model=ProfessorResponse,
    status_code=status.HTTP_200_OK,
    summary="Desvincular usuário de professor"
)
async def desvincular_usuario_professor(
    professor_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Remover vinculação entre professor e usuário.
    
    O professor permanece cadastrado mas perde acesso ao sistema.
    O usuário não é deletado, apenas desvinculado.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem desvincular usuários"
        )
    
    # Buscar professor
    result = await session.execute(
        select(Professor).where(
            Professor.id_professor == professor_id,
            Professor.is_deleted == False
        )
    )
    professor = result.scalar_one_or_none()
    
    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professor não encontrado"
        )
    
    # Verificar se professor tem usuário vinculado
    if professor.id_usuario is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este professor não possui usuário vinculado"
        )
    
    # Desvincular usuário
    professor.id_usuario = None
    professor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(professor)
    
    return ProfessorResponse(
        **professor.model_dump(),
        email_usuario=None
    )
