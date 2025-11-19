from datetime import datetime
import base64
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_session
from app.models.galeria import Galeria
from app.models.user import User, UserRole
from app.schemas.galeria import (
    GaleriaCreate,
    GaleriaUpdate,
    GaleriaResponse,
    GaleriaImageResponse,
    GaleriaListResponse
)
from app.core.security import get_current_user

router = APIRouter(prefix="/galeria", tags=["Galeria"])


@router.post(
    "/",
    response_model=GaleriaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar nova imagem na galeria"
)
async def create_galeria(
    galeria_data: GaleriaCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Adicionar nova imagem à galeria.
    
    **Permissão**: ADMIN e PROFESSOR
    
    A imagem deve ser enviada em formato Base64.
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e professores podem adicionar imagens"
        )
    
    # Converter Base64 para bytes
    imagem_bytes = None
    if galeria_data.imagem_base64:
        try:
            imagem_bytes = base64.b64decode(galeria_data.imagem_base64)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erro ao decodificar imagem Base64: {str(e)}"
            )
    
    # Criar registro
    galeria_dict = galeria_data.model_dump(exclude={"imagem_base64"})
    galeria = Galeria(**galeria_dict, imagem=imagem_bytes)
    
    session.add(galeria)
    await session.commit()
    await session.refresh(galeria)
    
    # Preparar resposta (sem dados binários)
    response = GaleriaResponse.model_validate(galeria)
    response.has_image = galeria.imagem is not None
    
    return response


@router.get(
    "/",
    response_model=GaleriaListResponse,
    summary="Listar galeria com paginação"
)
async def list_galeria(
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros"),
    id_evento: int = Query(None, description="Filtrar por ID do evento"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar imagens da galeria com paginação.
    
    **Permissão**: Todos os usuários autenticados
    """
    # Construir query base (apenas registros não deletados)
    query = select(Galeria).where(Galeria.is_deleted == False)
    count_query = select(func.count()).select_from(Galeria).where(
        Galeria.is_deleted == False
    )
    
    # Filtrar por evento se especificado
    if id_evento:
        query = query.where(Galeria.id_evento == id_evento)
        count_query = count_query.where(Galeria.id_evento == id_evento)
    
    # Contar total
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Buscar registros com paginação
    query = query.offset(offset).limit(limit).order_by(Galeria.data.desc(), Galeria.id_imagem.desc())
    result = await session.execute(query)
    galerias = result.scalars().all()
    
    # Preparar respostas (sem dados binários)
    items = []
    for galeria in galerias:
        response = GaleriaResponse.model_validate(galeria)
        response.has_image = galeria.imagem is not None
        items.append(response)
    
    return GaleriaListResponse(
        items=items,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/{galeria_id}",
    response_model=GaleriaResponse,
    summary="Buscar metadados da imagem por ID"
)
async def get_galeria(
    galeria_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar metadados da imagem por ID (sem retornar os bytes da imagem).
    
    Use o endpoint /galeria/{galeria_id}/image para baixar a imagem.
    
    **Permissão**: Todos os usuários autenticados
    """
    result = await session.execute(
        select(Galeria).where(
            Galeria.id_imagem == galeria_id,
            Galeria.is_deleted == False
        )
    )
    galeria = result.scalar_one_or_none()
    
    if not galeria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagem não encontrada"
        )
    
    response = GaleriaResponse.model_validate(galeria)
    response.has_image = galeria.imagem is not None
    
    return response


@router.get(
    "/{galeria_id}/image",
    response_model=GaleriaImageResponse,
    summary="Baixar imagem em Base64"
)
async def get_galeria_image(
    galeria_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Baixar imagem da galeria em formato Base64.
    
    **Permissão**: Todos os usuários autenticados
    """
    result = await session.execute(
        select(Galeria).where(
            Galeria.id_imagem == galeria_id,
            Galeria.is_deleted == False
        )
    )
    galeria = result.scalar_one_or_none()
    
    if not galeria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagem não encontrada"
        )
    
    if not galeria.imagem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Esta imagem não possui arquivo associado"
        )
    
    # Converter bytes para Base64
    imagem_base64 = base64.b64encode(galeria.imagem).decode('utf-8')
    
    return GaleriaImageResponse(
        id_imagem=galeria.id_imagem,
        imagem_base64=imagem_base64,
        descricao=galeria.descricao
    )


@router.put(
    "/{galeria_id}",
    response_model=GaleriaResponse,
    summary="Atualizar imagem da galeria"
)
async def update_galeria(
    galeria_id: int,
    galeria_data: GaleriaUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar dados da imagem da galeria.
    
    **Permissão**: ADMIN e PROFESSOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e professores podem atualizar imagens"
        )
    
    # Buscar imagem
    result = await session.execute(
        select(Galeria).where(
            Galeria.id_imagem == galeria_id,
            Galeria.is_deleted == False
        )
    )
    galeria = result.scalar_one_or_none()
    
    if not galeria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagem não encontrada"
        )
    
    # Atualizar campos
    update_data = galeria_data.model_dump(exclude_unset=True, exclude={"imagem_base64"})
    for field, value in update_data.items():
        setattr(galeria, field, value)
    
    # Atualizar imagem se fornecida
    if galeria_data.imagem_base64:
        try:
            galeria.imagem = base64.b64decode(galeria_data.imagem_base64)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erro ao decodificar imagem Base64: {str(e)}"
            )
    
    galeria.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(galeria)
    
    response = GaleriaResponse.model_validate(galeria)
    response.has_image = galeria.imagem is not None
    
    return response


@router.delete(
    "/{galeria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar imagem (soft delete)"
)
async def delete_galeria(
    galeria_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar imagem da galeria (Soft Delete).
    
    **Atenção**: Esta operação NÃO remove o registro do banco de dados,
    apenas marca como deletado (is_deleted = True).
    
    **Permissão**: ADMIN e PROFESSOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e professores podem deletar imagens"
        )
    
    # Buscar imagem
    result = await session.execute(
        select(Galeria).where(
            Galeria.id_imagem == galeria_id,
            Galeria.is_deleted == False
        )
    )
    galeria = result.scalar_one_or_none()
    
    if not galeria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagem não encontrada"
        )
    
    # Soft delete
    galeria.is_deleted = True
    galeria.deleted_at = datetime.utcnow()
    galeria.atualizado_em = datetime.utcnow()
    
    await session.commit()
    
    return None
