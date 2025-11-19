from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_session
from app.models.turma import Turma
from app.models.user import User, UserRole
from app.schemas.turma import (
    TurmaCreate,
    TurmaUpdate,
    TurmaResponse,
    TurmaListResponse
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
    response_model=TurmaListResponse,
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
    Listar turmas do sistema com paginação.
    
    **Permissão**: Todos os usuários autenticados
    """
    query = select(Turma).where(Turma.is_deleted == False)
    count_query = select(func.count()).select_from(Turma).where(Turma.is_deleted == False)
    
    # Filtrar por ano letivo se especificado
    if ano_letivo:
        query = query.where(Turma.ano_letivo == ano_letivo)
        count_query = count_query.where(Turma.ano_letivo == ano_letivo)
    
    result = await session.execute(count_query)
    total = result.scalar()
    
    query = query.offset(offset).limit(limit).order_by(Turma.ano_letivo.desc(), Turma.nome)
    result = await session.execute(query)
    turmas = result.scalars().all()
    
    return TurmaListResponse(items=turmas, total=total, offset=offset, limit=limit)


@router.get(
    "/{turma_id}",
    response_model=TurmaResponse,
    summary="Buscar turma por ID"
)
async def get_turma(
    turma_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Buscar turma por ID. **Permissão**: Todos"""
    result = await session.execute(
        select(Turma).where(Turma.id_turma == turma_id, Turma.is_deleted == False)
    )
    turma = result.scalar_one_or_none()
    
    if not turma:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
    
    return turma


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
