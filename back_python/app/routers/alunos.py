from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_session
from app.models.aluno import Aluno
from app.models.user import User, UserRole
from app.schemas.aluno import (
    AlunoCreate,
    AlunoUpdate,
    AlunoResponse,
    AlunoListResponse,
    VincularUsuarioCreate,
    VincularUsuarioExistente
)
from app.core.security import get_current_user, get_password_hash

router = APIRouter(prefix="/alunos", tags=["Alunos"])


@router.post(
    "/",
    response_model=AlunoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo aluno"
)
async def create_aluno(
    aluno_data: AlunoCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Criar novo aluno no sistema.
    
    **Mudança Arquitetural**: Agora cria apenas o registro do aluno,
    SEM vincular usuário automaticamente. Para criar acesso de login,
    use o endpoint POST /alunos/{aluno_id}/vincular-usuario
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem criar alunos"
        )
    
    # Verificar se já existe aluno com esta matrícula
    result = await session.execute(
        select(Aluno).where(
            Aluno.matricula == aluno_data.matricula,
            Aluno.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um aluno com esta matrícula"
        )
    
    # Verificar se já existe aluno com este CPF
    result = await session.execute(
        select(Aluno).where(
            Aluno.cpf == aluno_data.cpf,
            Aluno.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um aluno com este CPF"
        )
    
    # Criar o aluno (sem usuário vinculado)
    aluno = Aluno(**aluno_data.model_dump())
    session.add(aluno)
    await session.commit()
    await session.refresh(aluno)
    
    # Preparar resposta com email_usuario como None
    aluno_response = AlunoResponse(
        **aluno.model_dump(),
        email_usuario=None
    )
    
    return aluno_response


@router.get(
    "/",
    response_model=AlunoListResponse,
    summary="Listar alunos com paginação"
)
async def list_alunos(
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar alunos do sistema com paginação.
    
    **Permissão**: ADMIN, PROFESSOR e ALUNO
    
    - ALUNO pode ver apenas seus próprios dados
    - ADMIN e PROFESSOR podem ver todos os alunos
    """
    # Construir query base (apenas registros não deletados)
    query = select(Aluno).where(Aluno.is_deleted == False)
    
    # Se for ALUNO, filtrar apenas seus dados
    if current_user.perfil == UserRole.ALUNO:
        query = query.where(Aluno.id_usuario == current_user.id)
    
    # Contar total
    count_query = select(func.count()).select_from(Aluno).where(
        Aluno.is_deleted == False
    )
    if current_user.perfil == UserRole.ALUNO:
        count_query = count_query.where(Aluno.id_usuario == current_user.id)
    
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Buscar registros com paginação
    query = query.offset(offset).limit(limit).order_by(Aluno.id_aluno)
    result = await session.execute(query)
    alunos = result.scalars().all()
    
    # Enriquecer com email do usuário quando existir
    alunos_response = []
    for aluno in alunos:
        email_usuario = None
        if aluno.id_usuario:
            user_result = await session.execute(
                select(User).where(User.id == aluno.id_usuario)
            )
            usuario = user_result.scalar_one_or_none()
            if usuario:
                email_usuario = usuario.email
        
        alunos_response.append(
            AlunoResponse(
                **aluno.model_dump(),
                email_usuario=email_usuario
            )
        )
    
    return AlunoListResponse(
        items=alunos_response,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/buscar",
    response_model=List[AlunoResponse],  # 1. Mudança para Lista
    summary="Buscar aluno por ID, CPF ou nome"
)
async def get_alunos(  # Renomeado para plural
    aluno_id: int = Query(None, description="ID do aluno"),
    cpf: str = Query(None, description="CPF do aluno"),
    nome: str = Query(None, description="Nome do aluno (busca parcial)"),
    matricula: str = Query(None, description="Matrícula do aluno"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna uma lista de alunos.
    """
    # Validar parâmetros
    if not any([aluno_id, cpf, nome, matricula]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forneça pelo menos um parâmetro: aluno_id, cpf ou nome"
        )
    
    # 2. Otimização: JOIN direto para pegar o email (evita queries dentro do loop)
    query = (
        select(Aluno, User.email.label("email_usuario"))
        .outerjoin(User, Aluno.id_usuario == User.id)
        .where(Aluno.is_deleted == False)
    )
    
    # Aplicar filtros
    if aluno_id:
        query = query.where(Aluno.id_aluno == aluno_id)
    if cpf:
        query = query.where(Aluno.cpf == cpf)
    if nome:
        query = query.where(Aluno.nome.ilike(f"%{nome}%"))
    if matricula:
        query = query.where(Aluno.matricula == matricula)
    
    # 3. Segurança: Filtro direto na Query para ALUNO
    # Em vez de buscar tudo e dar erro 403 depois, nós filtramos a busca na fonte.
    # Se o aluno buscar "Robert", ele só verá o registro dele mesmo, se houver.
    if current_user.perfil == UserRole.ALUNO:
        query = query.where(Aluno.id_usuario == current_user.id)
    
    # Executar busca
    result = await session.execute(query)
    
    # 4. Método correto para listas: .all()
    rows = result.all()
    
    # Montar lista de resposta
    lista_alunos = []
    for row in rows:
        aluno, email = row
        
        # No caso de ADMIN/PROFESSOR, eles veem todos.
        # A lógica de segurança do ALUNO já foi resolvida no filtro da query acima.
        
        lista_alunos.append(
            AlunoResponse(
                **aluno.model_dump(),
                email_usuario=email
            )
        )
    
    return lista_alunos


@router.get(
    "/{aluno_id}",
    response_model=AlunoResponse,
    summary="Buscar aluno por ID (compatibilidade)"
)
async def get_aluno_by_id(
    aluno_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar aluno por ID (endpoint de compatibilidade).
    
    **Permissão**: ADMIN, PROFESSOR e ALUNO
    
    - ALUNO pode ver apenas seus próprios dados
    """
    # Buscar aluno
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_aluno == aluno_id,
            Aluno.is_deleted == False
        )
    )
    aluno = result.scalar_one_or_none()
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Verificar permissão (ALUNO só vê seus próprios dados)
    if current_user.perfil == UserRole.ALUNO and aluno.id_usuario != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso"
        )
    
    # Buscar email do usuário se existir vinculação
    email_usuario = None
    if aluno.id_usuario:
        user_result = await session.execute(
            select(User).where(User.id == aluno.id_usuario)
        )
        usuario = user_result.scalar_one_or_none()
        if usuario:
            email_usuario = usuario.email
    
    return AlunoResponse(
        **aluno.model_dump(),
        email_usuario=email_usuario
    )


@router.put(
    "/{aluno_id}",
    response_model=AlunoResponse,
    summary="Atualizar aluno"
)
async def update_aluno(
    aluno_id: int,
    aluno_data: AlunoUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar dados do aluno.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem atualizar alunos"
        )
    
    # Buscar aluno
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_aluno == aluno_id,
            Aluno.is_deleted == False
        )
    )
    aluno = result.scalar_one_or_none()
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Atualizar campos
    update_data = aluno_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(aluno, field, value)
    
    aluno.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(aluno)
    
    # Buscar email do usuário se existir vinculação
    email_usuario = None
    if aluno.id_usuario:
        user_result = await session.execute(
            select(User).where(User.id == aluno.id_usuario)
        )
        usuario = user_result.scalar_one_or_none()
        if usuario:
            email_usuario = usuario.email
    
    return AlunoResponse(
        **aluno.model_dump(),
        email_usuario=email_usuario
    )


@router.delete(
    "/{aluno_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar aluno (soft delete)"
)
async def delete_aluno(
    aluno_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar aluno do sistema (Soft Delete).
    
    **Atenção**: Esta operação NÃO remove o registro do banco de dados,
    apenas marca como deletado (is_deleted = True).
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem deletar alunos"
        )
    
    # Buscar aluno
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_aluno == aluno_id,
            Aluno.is_deleted == False
        )
    )
    aluno = result.scalar_one_or_none()
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Soft delete
    aluno.is_deleted = True
    aluno.deleted_at = datetime.utcnow()
    aluno.atualizado_em = datetime.utcnow()
    
    await session.commit()
    
    return None


# ============================================
# ENDPOINTS DE VINCULAÇÃO DE USUÁRIO
# ============================================

@router.post(
    "/{aluno_id}/vincular-usuario",
    response_model=AlunoResponse,
    status_code=status.HTTP_200_OK,
    summary="Criar e vincular usuário para aluno"
)
async def vincular_usuario_aluno(
    aluno_id: int,
    usuario_data: VincularUsuarioCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Criar um novo usuário e vincular a um aluno existente.
    
    Permite que um aluno (cadastrado como pessoa) receba acesso ao sistema.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem vincular usuários"
        )
    
    # Buscar aluno
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_aluno == aluno_id,
            Aluno.is_deleted == False
        )
    )
    aluno = result.scalar_one_or_none()
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Verificar se aluno já tem usuário vinculado
    if aluno.id_usuario is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este aluno já possui um usuário vinculado"
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
        email=usuario_data.email,
        senha_hash=get_password_hash(usuario_data.senha),
        perfil=UserRole.ALUNO,
        ativo=True
    )
    session.add(novo_usuario)
    await session.flush()  # Gerar ID do usuário
    
    # Vincular usuário ao aluno
    aluno.id_usuario = novo_usuario.id
    aluno.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(aluno)
    
    return AlunoResponse(
        **aluno.model_dump(),
        email_usuario=novo_usuario.email
    )


@router.put(
    "/{aluno_id}/vincular-usuario-existente",
    response_model=AlunoResponse,
    status_code=status.HTTP_200_OK,
    summary="Vincular usuário existente a aluno"
)
async def vincular_usuario_existente_aluno(
    aluno_id: int,
    vinculacao_data: VincularUsuarioExistente,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Vincular um usuário já existente a um aluno.
    
    Útil quando o usuário já foi criado mas não estava associado ao aluno.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem vincular usuários"
        )
    
    # Buscar aluno
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_aluno == aluno_id,
            Aluno.is_deleted == False
        )
    )
    aluno = result.scalar_one_or_none()
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Verificar se aluno já tem usuário vinculado
    if aluno.id_usuario is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este aluno já possui um usuário vinculado"
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
    
    # Verificar se usuário já está vinculado a outro aluno
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_usuario == vinculacao_data.id_usuario,
            Aluno.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuário já está vinculado a outro aluno"
        )
    
    # Verificar se perfil do usuário é ALUNO
    if usuario.perfil != UserRole.ALUNO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O usuário deve ter perfil ALUNO para ser vinculado a um aluno"
        )
    
    # Vincular usuário ao aluno
    aluno.id_usuario = usuario.id
    aluno.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(aluno)
    
    return AlunoResponse(
        **aluno.model_dump(),
        email_usuario=usuario.email
    )


@router.delete(
    "/{aluno_id}/desvincular-usuario",
    response_model=AlunoResponse,
    status_code=status.HTTP_200_OK,
    summary="Desvincular usuário de aluno"
)
async def desvincular_usuario_aluno(
    aluno_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Remover vinculação entre aluno e usuário.
    
    O aluno permanece cadastrado mas perde acesso ao sistema.
    O usuário não é deletado, apenas desvinculado.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem desvincular usuários"
        )
    
    # Buscar aluno
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_aluno == aluno_id,
            Aluno.is_deleted == False
        )
    )
    aluno = result.scalar_one_or_none()
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Verificar se aluno tem usuário vinculado
    if aluno.id_usuario is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este aluno não possui usuário vinculado"
        )
    
    # Desvincular usuário
    aluno.id_usuario = None
    aluno.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(aluno)
    
    return AlunoResponse(
        **aluno.model_dump(),
        email_usuario=None
    )
