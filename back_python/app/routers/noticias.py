from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_session
from app.models.noticia import Noticia
from app.models.user import User, UserRole
from app.schemas.noticia import (
    NoticiaCreate,
    NoticiaUpdate,
    NoticiaResponse,
    NoticiaListResponse
)
from app.core.security import get_current_user

router = APIRouter(prefix="/noticias", tags=["Notícias"])


@router.post(
    "/",
    response_model=NoticiaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar nova notícia"
)
async def create_noticia(
    noticia_data: NoticiaCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Criar nova notícia no sistema.
    
    **Permissão**: ADMIN ,PROFESSOR e SERVIDOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR, UserRole.SERVIDOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e professores podem criar notícias"
        )
    
    # Criar notícia
    noticia = Noticia(**noticia_data.model_dump())
    session.add(noticia)
    await session.commit()
    await session.refresh(noticia)
    
    return noticia


@router.get(
    "/",
    response_model=NoticiaListResponse,
    summary="Listar notícias com paginação"
)
async def list_noticias(
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar notícias do sistema com paginação.
    
    **Permissão**: Todos os usuários autenticados
    """
    # Construir query base (apenas registros não deletados)
    query = select(Noticia).where(Noticia.is_deleted == False)
    
    # Contar total
    count_query = select(func.count()).select_from(Noticia).where(
        Noticia.is_deleted == False
    )
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Buscar registros com paginação (ordenar por data decrescente)
    query = query.offset(offset).limit(limit).order_by(Noticia.data.desc(), Noticia.id_noticia.desc())
    result = await session.execute(query)
    noticias = result.scalars().all()
    
    return NoticiaListResponse(
        items=noticias,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/{noticia_id}",
    response_model=NoticiaResponse,
    summary="Buscar notícia por ID"
)
async def get_noticia(
    noticia_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar notícia por ID.
    
    **Permissão**: Todos os usuários autenticados
    """
    result = await session.execute(
        select(Noticia).where(
            Noticia.id_noticia == noticia_id,
            Noticia.is_deleted == False
        )
    )
    noticia = result.scalar_one_or_none()
    
    if not noticia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notícia não encontrada"
        )
    
    return noticia


@router.put(
    "/{noticia_id}",
    response_model=NoticiaResponse,
    summary="Atualizar notícia"
)
async def update_noticia(
    noticia_id: int,
    noticia_data: NoticiaUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar dados da notícia.
    
    **Permissão**: ADMIN ,PROFESSOR e SERVIDOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR, UserRole.SERVIDOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e professores podem atualizar notícias"
        )
    
    # Buscar notícia
    result = await session.execute(
        select(Noticia).where(
            Noticia.id_noticia == noticia_id,
            Noticia.is_deleted == False
        )
    )
    noticia = result.scalar_one_or_none()
    
    if not noticia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notícia não encontrada"
        )
    
    # Atualizar campos
    update_data = noticia_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(noticia, field, value)
    
    noticia.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(noticia)
    
    return noticia


@router.delete(
    "/{noticia_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar notícia (soft delete)"
)
async def delete_noticia(
    noticia_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar notícia do sistema (Soft Delete).
    
    **Atenção**: Esta operação NÃO remove o registro do banco de dados,
    apenas marca como deletado (is_deleted = True).
    
    **Permissão**: ADMIN ,PROFESSOR e SERVIDOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR, UserRole.SERVIDOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e professores podem deletar notícias"
        )
    
    # Buscar notícia
    result = await session.execute(
        select(Noticia).where(
            Noticia.id_noticia == noticia_id,
            Noticia.is_deleted == False
        )
    )
    noticia = result.scalar_one_or_none()
    
    if not noticia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notícia não encontrada"
        )
    
    # Soft delete
    noticia.is_deleted = True
    noticia.deleted_at = datetime.utcnow()
    noticia.atualizado_em = datetime.utcnow()
    
    await session.commit()
    
    return None
