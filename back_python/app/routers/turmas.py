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
    Listar turmas do sistema com paginação e dados enriquecidos (nome do professor e disciplina).
    
    **Permissão**: Todos os usuários autenticados
    """
    # Query com LEFT JOIN para trazer nome do professor e disciplina
    query = (
        select(Turma, Professor.nome.label("nome_professor"), Disciplina.nome.label("nome_disciplina"))
        .outerjoin(Professor, Turma.id_professor == Professor.id_professor)
        .outerjoin(Disciplina, Turma.id_disciplina == Disciplina.id_disciplina)
        .where(Turma.is_deleted == False)
        .order_by(Turma.nome.asc())
    )
    
    count_query = select(func.count()).select_from(Turma).where(Turma.is_deleted == False)
    
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
    response_model=TurmaResponseEnriched,
    summary="Buscar turma por ID, nome, série, turno ou professor"
)
async def get_turma(
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
    Buscar turma com dados enriquecidos (nome do professor e disciplina).
    
    **Parâmetros de busca** (forneça pelo menos um):
    - **turma_id**: Busca exata por ID
    - **nome**: Busca parcial por nome da turma (LIKE)
    - **serie**: Busca exata por série
    - **turno**: Busca exata por turno (MANHA, TARDE, NOITE)
    - **nome_professor**: Busca parcial por nome do professor (LIKE)
    - **nome_disciplina**: Busca parcial por nome da disciplina (LIKE)
    
    **Permissão**: Todos os usuários autenticados
    """
    # Validar que pelo menos um parâmetro foi fornecido
    if not turma_id and not nome and not serie and not turno and not nome_professor and not nome_disciplina:
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
    
    # Aplicar filtros conforme parâmetros fornecidos
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
        
    # Executar busca
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
