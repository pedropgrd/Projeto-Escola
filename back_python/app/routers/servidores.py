from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_session
from app.models.servidor import Servidor
from app.models.user import User, UserRole
from app.schemas.servidor import (
    ServidorCreate,
    ServidorUpdate,
    ServidorResponse,
    ServidorListResponse,
    VincularUsuarioCreate,
    VincularUsuarioExistente
)
from app.core.security import get_current_user, get_password_hash

router = APIRouter(prefix="/servidores", tags=["Servidores"])


@router.post(
    "/",
    response_model=ServidorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo servidor"
)
async def create_servidor(
    servidor_data: ServidorCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Criar novo servidor no sistema.
    
    **Mudança Arquitetural**: Agora cria apenas o registro do servidor,
    SEM vincular usuário automaticamente. Para criar acesso de login,
    use o endpoint POST /servidores/{servidor_id}/vincular-usuario
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão - Apenas ADMIN pode criar servidores
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem criar servidores"
        )
    
    # Verificar se já existe servidor com este CPF
    result = await session.execute(
        select(Servidor).where(
            Servidor.cpf == servidor_data.cpf,
            Servidor.ativo == True
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um servidor com este CPF"
        )
    
    # Criar o servidor (sem usuário vinculado)
    servidor = Servidor(**servidor_data.model_dump())
    session.add(servidor)
    await session.commit()
    await session.refresh(servidor)
    
    # Preparar resposta com email_usuario como None
    servidor_response = ServidorResponse(
        **servidor.model_dump(),
        email_usuario=None
    )
    
    return servidor_response


@router.get(
    "/",
    response_model=ServidorListResponse,
    summary="Listar servidores com paginação"
)
async def list_servidores(
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar servidores do sistema com paginação.
    
    **Permissão**: ADMIN, PROFESSOR e SERVIDOR (visualização global)
    """
    # Verificar permissão - SERVIDOR tem permissão de visualização
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR, UserRole.SERVIDOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso"
        )
    
    # Construir query base (apenas registros ativos)
    query = select(Servidor).where(Servidor.ativo == True)
    
    # Contar total
    count_query = select(func.count()).select_from(Servidor).where(
        Servidor.ativo == True
    )
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Buscar registros com paginação
    query = query.offset(offset).limit(limit).order_by(Servidor.id_servidor)
    result = await session.execute(query)
    servidores = result.scalars().all()
    
    # Enriquecer com email do usuário quando existir
    servidores_response = []
    for servidor in servidores:
        email_usuario = None
        if servidor.id_usuario:
            user_result = await session.execute(
                select(User).where(User.id == servidor.id_usuario)
            )
            usuario = user_result.scalar_one_or_none()
            if usuario:
                email_usuario = usuario.email
        
        servidores_response.append(
            ServidorResponse(
                **servidor.model_dump(),
                email_usuario=email_usuario
            )
        )
    
    return ServidorListResponse(
        items=servidores_response,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/buscar",
    response_model=ServidorResponse,
    summary="Buscar servidor por ID, CPF ou nome"
)
async def get_servidor(
    servidor_id: int = Query(None, description="ID do servidor"),
    cpf: str = Query(None, description="CPF do servidor"),
    nome: str = Query(None, description="Nome do servidor (busca parcial)"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar servidor por ID, CPF ou nome.
    
    **Parâmetros de busca** (forneça pelo menos um):
    - **servidor_id**: Busca exata por ID
    - **cpf**: Busca exata por CPF
    - **nome**: Busca parcial por nome (LIKE)
    
    **Permissão**: ADMIN, PROFESSOR e SERVIDOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR, UserRole.SERVIDOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso"
        )
    
    # Validar que pelo menos um parâmetro foi fornecido
    if not servidor_id and not cpf and not nome:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forneça pelo menos um parâmetro: servidor_id, cpf ou nome"
        )
    
    # Construir query base
    query = select(Servidor).where(Servidor.ativo == True)
    
    # Aplicar filtros conforme parâmetros fornecidos
    if servidor_id:
        query = query.where(Servidor.id_servidor == servidor_id)
    if cpf:
        query = query.where(Servidor.cpf == cpf)
    if nome:
        query = query.where(Servidor.nome.ilike(f"%{nome}%"))
    
    # Executar busca
    result = await session.execute(query)
    servidor = result.scalar_one_or_none()
    
    if not servidor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servidor não encontrado"
        )
    
    # Buscar email do usuário se existir vinculação
    email_usuario = None
    if servidor.id_usuario:
        user_result = await session.execute(
            select(User).where(User.id == servidor.id_usuario)
        )
        usuario = user_result.scalar_one_or_none()
        if usuario:
            email_usuario = usuario.email
    
    return ServidorResponse(
        **servidor.model_dump(),
        email_usuario=email_usuario
    )


@router.get(
    "/{servidor_id}",
    response_model=ServidorResponse,
    summary="Buscar servidor por ID"
)
async def get_servidor_by_id(
    servidor_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar servidor por ID.
    
    **Permissão**: ADMIN, PROFESSOR e SERVIDOR
    """
    # Verificar permissão
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR, UserRole.SERVIDOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso"
        )
    
    # Buscar servidor
    result = await session.execute(
        select(Servidor).where(
            Servidor.id_servidor == servidor_id,
            Servidor.ativo == True
        )
    )
    servidor = result.scalar_one_or_none()
    
    if not servidor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servidor não encontrado"
        )
    
    # Buscar email do usuário se existir vinculação
    email_usuario = None
    if servidor.id_usuario:
        user_result = await session.execute(
            select(User).where(User.id == servidor.id_usuario)
        )
        usuario = user_result.scalar_one_or_none()
        if usuario:
            email_usuario = usuario.email
    
    return ServidorResponse(
        **servidor.model_dump(),
        email_usuario=email_usuario
    )


@router.put(
    "/{servidor_id}",
    response_model=ServidorResponse,
    summary="Atualizar servidor"
)
async def update_servidor(
    servidor_id: int,
    servidor_data: ServidorUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar dados do servidor.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão - Apenas ADMIN pode atualizar
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem atualizar servidores"
        )
    
    # Buscar servidor
    result = await session.execute(
        select(Servidor).where(
            Servidor.id_servidor == servidor_id,
            Servidor.ativo == True
        )
    )
    servidor = result.scalar_one_or_none()
    
    if not servidor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servidor não encontrado"
        )
    
    # Verificar CPF duplicado se estiver sendo alterado
    if servidor_data.cpf and servidor_data.cpf != servidor.cpf:
        result = await session.execute(
            select(Servidor).where(
                Servidor.cpf == servidor_data.cpf,
                Servidor.ativo == True,
                Servidor.id_servidor != servidor_id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um servidor com este CPF"
            )
    
    # Atualizar campos fornecidos
    update_data = servidor_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(servidor, key, value)
    
    servidor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(servidor)
    
    # Buscar email do usuário se existir vinculação
    email_usuario = None
    if servidor.id_usuario:
        user_result = await session.execute(
            select(User).where(User.id == servidor.id_usuario)
        )
        usuario = user_result.scalar_one_or_none()
        if usuario:
            email_usuario = usuario.email
    
    return ServidorResponse(
        **servidor.model_dump(),
        email_usuario=email_usuario
    )


@router.delete(
    "/{servidor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar servidor (soft delete)"
)
async def delete_servidor(
    servidor_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar servidor (soft delete - marca como inativo).
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão - Apenas ADMIN pode deletar
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem deletar servidores"
        )
    
    # Buscar servidor
    result = await session.execute(
        select(Servidor).where(
            Servidor.id_servidor == servidor_id,
            Servidor.ativo == True
        )
    )
    servidor = result.scalar_one_or_none()
    
    if not servidor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servidor não encontrado"
        )
    
    # Soft delete
    servidor.ativo = False
    servidor.atualizado_em = datetime.utcnow()
    
    # Se houver usuário vinculado, também desativa o usuário
    if servidor.id_usuario:
        user_result = await session.execute(
            select(User).where(User.id == servidor.id_usuario)
        )
        usuario = user_result.scalar_one_or_none()
        if usuario:
            usuario.ativo = False
            usuario.atualizado_em = datetime.utcnow()
    
    await session.commit()


# ============================================
# ENDPOINTS DE VINCULAÇÃO DE USUÁRIO
# ============================================

@router.post(
    "/{servidor_id}/vincular-usuario",
    response_model=ServidorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar e vincular usuário ao servidor"
)
async def vincular_usuario_servidor(
    servidor_id: int,
    usuario_data: VincularUsuarioCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Criar novo usuário e vincular a um servidor existente.
    
    **Regra**: O CPF do servidor deve corresponder ao CPF fornecido.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem vincular usuários"
        )
    
    # Buscar servidor
    result = await session.execute(
        select(Servidor).where(
            Servidor.id_servidor == servidor_id,
            Servidor.ativo == True
        )
    )
    servidor = result.scalar_one_or_none()
    
    if not servidor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servidor não encontrado"
        )
    
    # Verificar se CPF corresponde
    if servidor.cpf != usuario_data.cpf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF fornecido não corresponde ao CPF do servidor"
        )
    
    # Verificar se servidor já tem usuário vinculado
    if servidor.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Servidor já possui usuário vinculado"
        )
    
    if not usuario_data.cpf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF é obrigatório para criar o usuário do servidor"
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
    
    # Verificar se email já existe
    result = await session.execute(
        select(User).where(User.email == usuario_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado no sistema"
        )
    
    # Criar novo usuário com perfil SERVIDOR
    novo_usuario = User(
        cpf=usuario_data.cpf,
        email=usuario_data.email,
        senha_hash=get_password_hash(usuario_data.senha),
        perfil=UserRole.SERVIDOR,
        ativo=True
    )
    session.add(novo_usuario)
    await session.flush()  # Gerar ID do usuário
    
    # Vincular usuário ao servidor
    servidor.id_usuario = novo_usuario.id
    servidor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(servidor)
    
    return ServidorResponse(
        **servidor.model_dump(),
        email_usuario=novo_usuario.email
    )


@router.post(
    "/{servidor_id}/vincular-usuario-existente",
    response_model=ServidorResponse,
    summary="Vincular usuário existente ao servidor"
)
async def vincular_usuario_existente_servidor(
    servidor_id: int,
    vinculo_data: VincularUsuarioExistente,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Vincular um usuário existente a um servidor.
    
    **Regra**: O CPF do servidor deve corresponder ao CPF fornecido.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem vincular usuários"
        )
    
    # Buscar servidor
    result = await session.execute(
        select(Servidor).where(
            Servidor.id_servidor == servidor_id,
            Servidor.ativo == True
        )
    )
    servidor = result.scalar_one_or_none()
    
    if not servidor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servidor não encontrado"
        )
    
    # Verificar se CPF corresponde
    if servidor.cpf != vinculo_data.cpf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF fornecido não corresponde ao CPF do servidor"
        )
    
    # Verificar se servidor já tem usuário vinculado
    if servidor.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Servidor já possui usuário vinculado"
        )
    
    # Buscar usuário existente
    result = await session.execute(
        select(User).where(User.id == vinculo_data.usuario_id)
    )
    usuario = result.scalar_one_or_none()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Verificar se usuário já está vinculado a outro servidor
    result = await session.execute(
        select(Servidor).where(
            Servidor.id_usuario == vinculo_data.usuario_id,
            Servidor.ativo == True
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário já está vinculado a outro servidor"
        )
    
    # Verificar se perfil do usuário é SERVIDOR
    if usuario.perfil != UserRole.SERVIDOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O usuário deve ter perfil SERVIDOR para ser vinculado a um servidor"
        )
    
    # Vincular usuário ao servidor
    servidor.id_usuario = usuario.id
    servidor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(servidor)
    
    return ServidorResponse(
        **servidor.model_dump(),
        email_usuario=usuario.email
    )


@router.delete(
    "/{servidor_id}/desvincular-usuario",
    response_model=ServidorResponse,
    summary="Desvincular usuário do servidor"
)
async def desvincular_usuario_servidor(
    servidor_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Desvincular usuário de um servidor.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem desvincular usuários"
        )
    
    # Buscar servidor
    result = await session.execute(
        select(Servidor).where(
            Servidor.id_servidor == servidor_id,
            Servidor.ativo == True
        )
    )
    servidor = result.scalar_one_or_none()
    
    if not servidor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servidor não encontrado"
        )
    
    # Verificar se há usuário vinculado
    if not servidor.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Servidor não possui usuário vinculado"
        )
    
    # Desvincular
    servidor.id_usuario = None
    servidor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    await session.refresh(servidor)
    
    return ServidorResponse(
        **servidor.model_dump(),
        email_usuario=None
    )
