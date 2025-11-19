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
    AlunoListResponse
)
from app.core.security import get_current_user

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
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem criar alunos"
        )
    
    # Verificar se o usuário existe
    result = await session.execute(select(User).where(User.id == aluno_data.id_usuario))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
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
    
    # Verificar se já existe aluno para este usuário
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_usuario == aluno_data.id_usuario,
            Aluno.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um aluno cadastrado para este usuário"
        )
    
    # Criar o aluno
    aluno = Aluno(**aluno_data.model_dump())
    session.add(aluno)
    await session.commit()
    await session.refresh(aluno)
    
    return aluno


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
    
    return AlunoListResponse(
        items=alunos,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/{aluno_id}",
    response_model=AlunoResponse,
    summary="Buscar aluno por ID"
)
async def get_aluno(
    aluno_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar aluno por ID.
    
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
    
    return aluno


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
    
    return aluno


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
