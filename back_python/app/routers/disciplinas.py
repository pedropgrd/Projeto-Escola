from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_session
from app.models.disciplina import Disciplina
from app.models.user import User, UserRole
from app.schemas.disciplina import (
    DisciplinaCreate,
    DisciplinaUpdate,
    DisciplinaResponse,
    DisciplinaListResponse
)
from app.core.security import get_current_user

router = APIRouter(prefix="/disciplinas", tags=["Disciplinas"])


@router.post(
    "/",
    response_model=DisciplinaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar nova disciplina"
)
async def create_disciplina(
    disciplina_data: DisciplinaCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Criar nova disciplina no sistema.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem criar disciplinas"
        )
    
    # Verificar se já existe disciplina com este nome
    result = await session.execute(
        select(Disciplina).where(
            Disciplina.nome == disciplina_data.nome,
            Disciplina.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe uma disciplina com o nome '{disciplina_data.nome}'"
        )
    
    # Criar a disciplina
    disciplina = Disciplina(**disciplina_data.model_dump())
    session.add(disciplina)
    await session.commit()
    await session.refresh(disciplina)
    
    return disciplina


@router.get(
    "/",
    response_model=DisciplinaListResponse,
    summary="Listar disciplinas com paginação"
)
async def list_disciplinas(
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar disciplinas do sistema com paginação.
    
    **Permissão**: ADMIN, PROFESSOR e ALUNO
    """
    # Construir query base (apenas registros não deletados)
    query = select(Disciplina).where(Disciplina.is_deleted == False)
    
    # Contar total
    count_query = select(func.count()).select_from(Disciplina).where(
        Disciplina.is_deleted == False
    )
    
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Buscar registros com paginação
    query = query.offset(offset).limit(limit).order_by(Disciplina.nome)
    result = await session.execute(query)
    disciplinas = result.scalars().all()
    
    return DisciplinaListResponse(
        items=disciplinas,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/{disciplina_id}",
    response_model=DisciplinaResponse,
    summary="Buscar disciplina por ID"
)
async def get_disciplina(
    disciplina_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar disciplina por ID.
    
    **Permissão**: ADMIN, PROFESSOR e ALUNO
    """
    # Buscar disciplina
    result = await session.execute(
        select(Disciplina).where(
            Disciplina.id_disciplina == disciplina_id,
            Disciplina.is_deleted == False
        )
    )
    disciplina = result.scalar_one_or_none()
    
    if not disciplina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disciplina não encontrada"
        )
    
    return disciplina


@router.put(
    "/{disciplina_id}",
    response_model=DisciplinaResponse,
    summary="Atualizar disciplina"
)
async def update_disciplina(
    disciplina_id: int,
    disciplina_data: DisciplinaUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar dados da disciplina.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem atualizar disciplinas"
        )
    
    # Buscar disciplina
    result = await session.execute(
        select(Disciplina).where(
            Disciplina.id_disciplina == disciplina_id,
            Disciplina.is_deleted == False
        )
    )
    disciplina = result.scalar_one_or_none()
    
    if not disciplina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disciplina não encontrada"
        )
    
    # Atualizar campos
    update_data = disciplina_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(disciplina, field, value)
    
    disciplina.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(disciplina)
    
    return disciplina


@router.delete(
    "/{disciplina_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar disciplina (soft delete)"
)
async def delete_disciplina(
    disciplina_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar disciplina do sistema (Soft Delete).
    
    **Atenção**: Esta operação NÃO remove o registro do banco de dados,
    apenas marca como deletado (is_deleted = True).
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem deletar disciplinas"
        )
    
    # Buscar disciplina
    result = await session.execute(
        select(Disciplina).where(
            Disciplina.id_disciplina == disciplina_id,
            Disciplina.is_deleted == False
        )
    )
    disciplina = result.scalar_one_or_none()
    
    if not disciplina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disciplina não encontrada"
        )
    
    # Soft delete
    disciplina.is_deleted = True
    disciplina.deleted_at = datetime.utcnow()
    disciplina.atualizado_em = datetime.utcnow()
    
    await session.commit()
    
    return None
