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
    ProfessorListResponse
)
from app.core.security import get_current_user

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
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem criar professores"
        )
    
    # Verificar se o usuário existe
    result = await session.execute(select(User).where(User.id == professor_data.id_usuario))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
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
    
    # Verificar se já existe professor para este usuário
    result = await session.execute(
        select(Professor).where(
            Professor.id_usuario == professor_data.id_usuario,
            Professor.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um professor cadastrado para este usuário"
        )
    
    # Criar o professor
    professor = Professor(**professor_data.model_dump())
    session.add(professor)
    await session.commit()
    await session.refresh(professor)
    
    return professor


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
    
    return ProfessorListResponse(
        items=professores,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/{professor_id}",
    response_model=ProfessorResponse,
    summary="Buscar professor por ID"
)
async def get_professor(
    professor_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar professor por ID.
    
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
    
    return professor


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
    
    return professor


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
