from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_session
from app.models.turma import Turma
from app.models.professor import Professor
from app.models.disciplina import Disciplina
from app.models.user import User, UserRole
from app.schemas.turma import (
    TurmaCreate,
    TurmaUpdate,
    TurmaResponse,
    TurmaResponseEnriched,
    TurmaListResponse,
    TurmaListResponseEnriched
)
from app.core.security import get_current_user

router = APIRouter(prefix="/turmas", tags=["Turmas"])


@router.post(
    "/",
    response_model=TurmaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar nova turma"
)
async def create_turma(
    turma_data: TurmaCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Criar nova turma no sistema.
    
    **Permissão**: Apenas ADMIN
    """
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem criar turmas"
        )
    
    turma = Turma(**turma_data.model_dump())
    session.add(turma)
    await session.commit()
    await session.refresh(turma)
    
    return turma


@router.get(
    "/",
    response_model=TurmaListResponseEnriched,
    summary="Listar turmas com paginação"
)
async def list_turmas(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    ano_letivo: int = Query(None, description="Filtrar por ano letivo"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar turmas do sistema com paginação e dados enriquecidos.
    
    **Permissões:**
    - ADMIN: Visualiza todas as turmas
    - PROFESSOR: Visualiza apenas turmas em que está vinculado
    - ALUNO: Visualiza apenas turmas em que está vinculado
    """
    # Query base com LEFT JOIN para trazer nome do professor e disciplina
    query = (
        select(Turma, Professor.nome.label("nome_professor"), Disciplina.nome.label("nome_disciplina"))
        .outerjoin(Professor, Turma.id_professor == Professor.id_professor)
        .outerjoin(Disciplina, Turma.id_disciplina == Disciplina.id_disciplina)
        .where(Turma.is_deleted == False)
    )
    
    count_query = select(func.count()).select_from(Turma).where(Turma.is_deleted == False)
    
    # Aplicar filtros baseado no perfil do usuário
    if current_user.perfil == UserRole.PROFESSOR:
        # Buscar o id_professor vinculado ao usuário
        prof_result = await session.execute(
            select(Professor.id_professor).where(Professor.id_usuario == current_user.id)
        )
        id_professor = prof_result.scalar_one_or_none()
        
        if not id_professor:
            # Professor não está vinculado a nenhuma turma
            return TurmaListResponseEnriched(
                items=[],
                total=0,
                offset=offset,
                limit=limit,
                message="Você não está vinculado a nenhuma turma como professor"
            )
        
        query = query.where(Turma.id_professor == id_professor)
        count_query = count_query.where(Turma.id_professor == id_professor)
    
    elif current_user.perfil == UserRole.ALUNO:
        # Buscar o id_aluno vinculado ao usuário
        from app.models.aluno import Aluno
        from app.models.aluno_turma import AlunoTurma
        
        aluno_result = await session.execute(
            select(Aluno.id_aluno).where(Aluno.id_usuario == current_user.id)
        )
        id_aluno = aluno_result.scalar_one_or_none()
        
        if not id_aluno:
            # Aluno não está vinculado a nenhuma turma
            return TurmaListResponseEnriched(
                items=[],
                total=0,
                offset=offset,
                limit=limit,
                message="Você não está vinculado a nenhuma turma como aluno"
            )
        
        # Filtrar apenas turmas em que o aluno está matriculado
        query = query.join(AlunoTurma, Turma.id_turma == AlunoTurma.id_turma).where(
            AlunoTurma.id_aluno == id_aluno,
            AlunoTurma.is_deleted == False
        )
        count_query = (
            count_query.join(AlunoTurma, Turma.id_turma == AlunoTurma.id_turma)
            .where(AlunoTurma.id_aluno == id_aluno, AlunoTurma.is_deleted == False)
        )
    
    # ADMIN vê todas as turmas (sem filtro adicional)
    
    # Filtrar por ano letivo se especificado
    if ano_letivo:
        query = query.where(Turma.ano_letivo == ano_letivo)
        count_query = count_query.where(Turma.ano_letivo == ano_letivo)
    
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Aplicar paginação e ordenação
    query = query.offset(offset).limit(limit).order_by(Turma.ano_letivo.desc(), Turma.nome)
    result = await session.execute(query)
    
    # Processar resultados com dados enriquecidos
    turmas_enriquecidas = []
    for row in result.all():
        turma, prof_nome, disc_nome = row
        turmas_enriquecidas.append(
            TurmaResponseEnriched(
                **turma.model_dump(),
                nome_professor=prof_nome,
                nome_disciplina=disc_nome
            )
        )
    
    return TurmaListResponseEnriched(items=turmas_enriquecidas, total=total, offset=offset, limit=limit)

@router.get(
    "/buscar",
    response_model=List[TurmaResponseEnriched], # 1. Retorna uma Lista
    summary="Buscar turmas por ID, nome, série, turno ou professor"
)
async def get_turmas( # Renomeei para plural para semântica correta
    turma_id: int = Query(None, description="ID da turma"),
    nome: str = Query(None, description="Nome da turma (busca parcial)"),
    serie: str = Query(None, description="Série da turma"),
    turno: str = Query(None, description="Turno da turma (MANHA, TARDE, NOITE)"),
    nome_professor: str = Query(None, description="Nome do professor (busca parcial)"),
    nome_disciplina: str = Query(None, description="Nome da disciplina (busca parcial)"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar turmas com dados enriquecidos. Retorna uma lista vazia se nada for encontrado.
    """
    # Validar que pelo menos um parâmetro foi fornecido
    if not any([turma_id, nome, serie, turno, nome_professor, nome_disciplina]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forneça pelo menos um parâmetro: turma_id, nome, serie, turno ou nome_professor"
        )
    
    # Construir query com LEFT JOIN
    query = (
        select(Turma, Professor.nome.label("nome_professor"), Disciplina.nome.label("nome_disciplina"))
        .outerjoin(Professor, Turma.id_professor == Professor.id_professor)
        .outerjoin(Disciplina, Turma.id_disciplina == Disciplina.id_disciplina)
        .where(Turma.is_deleted == False)
        .order_by(Turma.serie.desc())
    )
    
    # Aplicar filtros
    if turma_id:
        query = query.where(Turma.id_turma == turma_id)
    if nome:
        query = query.where(Turma.nome.ilike(f"%{nome}%"))
    if serie:
        query = query.where(Turma.serie == serie)
    if turno:
        query = query.where(Turma.turno == turno)
    if nome_professor:
        query = query.where(Professor.nome.ilike(f"%{nome_professor}%"))
    if nome_disciplina:
        query = query.where(Disciplina.nome.ilike(f"%{nome_disciplina}%"))
        
    # 2. Executar busca
    result = await session.execute(query)
    
    # 3. Buscar TODOS os registros em vez de apenas o primeiro
    rows = result.all()
    
    # 4. Processamento e Montagem da Lista
    # Não levantamos 404 aqui. Se rows for vazio, o loop não roda e retornamos [] (Status 200)
    lista_resposta = []
    
    for row in rows:
        turma, prof_nome, disc_nome = row
        
        # Cria o objeto enriquecido para cada linha encontrada
        item = TurmaResponseEnriched(
            **turma.model_dump(),
            nome_professor=prof_nome,
            nome_disciplina=disc_nome
        )
        lista_resposta.append(item)
    
    return lista_resposta

@router.get(
    "/{turma_id}",
    response_model=TurmaResponseEnriched,
    summary="Buscar turma por ID (compatibilidade)"
)
async def get_turma_by_id(
    turma_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar turma por ID com dados enriquecidos (endpoint de compatibilidade).
    
    **Permissão**: Todos os usuários autenticados
    """
    # Query com LEFT JOIN
    query = (
        select(Turma, Professor.nome.label("nome_professor"), Disciplina.nome.label("nome_disciplina"))
        .outerjoin(Professor, Turma.id_professor == Professor.id_professor)
        .outerjoin(Disciplina, Turma.id_disciplina == Disciplina.id_disciplina)
        .where(Turma.id_turma == turma_id, Turma.is_deleted == False)
    )
    
    result = await session.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    
    turma, prof_nome, disc_nome = row
    
    return TurmaResponseEnriched(
        **turma.model_dump(),
        nome_professor=prof_nome,
        nome_disciplina=disc_nome
    )


@router.put(
    "/{turma_id}",
    response_model=TurmaResponse,
    summary="Atualizar turma"
)
async def update_turma(
    turma_id: int,
    turma_data: TurmaUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar dados da turma.
    
    **Permissão**: Apenas ADMIN
    """
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem atualizar turmas"
        )
    
    result = await session.execute(
        select(Turma).where(Turma.id_turma == turma_id, Turma.is_deleted == False)
    )
    turma = result.scalar_one_or_none()
    
    if not turma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
    
    update_data = turma_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(turma, field, value)
    
    turma.atualizado_em = datetime.utcnow()
    await session.commit()
    await session.refresh(turma)
    
    return turma


@router.delete(
    "/{turma_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar turma (soft delete)"
)
async def delete_turma(
    turma_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar turma (Soft Delete).
    
    **Permissão**: Apenas ADMIN
    """
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem deletar turmas"
        )
    
    result = await session.execute(
        select(Turma).where(Turma.id_turma == turma_id, Turma.is_deleted == False)
    )
    turma = result.scalar_one_or_none()
    
    if not turma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
    
    turma.is_deleted = True
    turma.deleted_at = datetime.utcnow()
    turma.atualizado_em = datetime.utcnow()
    
    await session.commit()
    return None
