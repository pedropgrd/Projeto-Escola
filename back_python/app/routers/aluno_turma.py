from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_session
from app.models.aluno_turma import AlunoTurma
from app.models.aluno import Aluno
from app.models.turma import Turma
from app.models.professor import Professor
from app.models.disciplina import Disciplina
from app.models.user import User, UserRole
from app.schemas.aluno_turma import (
    AlunoTurmaCreate,
    AlunoTurmaResponse,
    AlunoTurmaListResponse,
    AlunoTurmaSimpleResponse
)
from app.core.security import get_current_user

router = APIRouter(prefix="/aluno-turma", tags=["Aluno-Turma"])


@router.post(
    "/",
    response_model=AlunoTurmaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Matricular aluno em turma"
)
async def matricular_aluno(
    matricula_data: AlunoTurmaCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Matricular um aluno em uma turma.
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem matricular alunos"
        )
    
    # Verificar se aluno existe
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_aluno == matricula_data.id_aluno,
            Aluno.is_deleted == False
        )
    )
    aluno = result.scalar_one_or_none()
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Verificar se turma existe
    result = await session.execute(
        select(Turma).where(
            Turma.id_turma == matricula_data.id_turma,
            Turma.is_deleted == False
        )
    )
    turma = result.scalar_one_or_none()
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    
    # Verificar se aluno já está matriculado nesta turma
    result = await session.execute(
        select(AlunoTurma).where(
            AlunoTurma.id_aluno == matricula_data.id_aluno,
            AlunoTurma.id_turma == matricula_data.id_turma,
            AlunoTurma.is_deleted == False
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aluno já está matriculado nesta turma"
        )
    
    # Criar matrícula
    aluno_turma = AlunoTurma(**matricula_data.model_dump())
    session.add(aluno_turma)
    await session.commit()
    await session.refresh(aluno_turma)
    
    return aluno_turma


@router.get(
    "/",
    response_model=AlunoTurmaListResponse,
    summary="Listar matrículas com paginação"
)
async def list_matriculas(
    offset: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de registros"),
    id_aluno: int = Query(None, description="Filtrar por ID do aluno"),
    id_turma: int = Query(None, description="Filtrar por ID da turma"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar matrículas do sistema com paginação.
    
    **Permissão**: ADMIN, PROFESSOR e ALUNO
    
    Filtros opcionais:
    - **id_aluno**: Filtrar matrículas de um aluno específico
    - **id_turma**: Filtrar matrículas de uma turma específica
    """
    # Construir query base (apenas registros não deletados)
    query = select(AlunoTurma).where(AlunoTurma.is_deleted == False)
    
    # Aplicar filtros se fornecidos
    if id_aluno:
        query = query.where(AlunoTurma.id_aluno == id_aluno)
    if id_turma:
        query = query.where(AlunoTurma.id_turma == id_turma)
    
    # Contar total
    count_query = select(func.count()).select_from(AlunoTurma).where(
        AlunoTurma.is_deleted == False
    )
    if id_aluno:
        count_query = count_query.where(AlunoTurma.id_aluno == id_aluno)
    if id_turma:
        count_query = count_query.where(AlunoTurma.id_turma == id_turma)
    
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Buscar registros com paginação
    query = query.offset(offset).limit(limit).order_by(AlunoTurma.criado_em.desc())
    result = await session.execute(query)
    matriculas = result.scalars().all()
    
    return AlunoTurmaListResponse(
        items=matriculas,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/{matricula_id}",
    response_model=AlunoTurmaResponse,
    summary="Buscar matrícula por ID"
)
async def get_matricula(
    matricula_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar matrícula por ID.
    
    **Permissão**: ADMIN, PROFESSOR e ALUNO
    """
    # Buscar matrícula
    result = await session.execute(
        select(AlunoTurma).where(
            AlunoTurma.id == matricula_id,
            AlunoTurma.is_deleted == False
        )
    )
    matricula = result.scalar_one_or_none()
    
    if not matricula:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matrícula não encontrada"
        )
    
    return matricula


@router.delete(
    "/{id_alunoTurma}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover aluno da turma (soft delete)"
)
async def remover_aluno_turma(
    id_alunoTurma: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Remover aluno de uma turma (Soft Delete).
    
    **Atenção**: Esta operação NÃO remove o registro do banco de dados,
    apenas marca como deletado (is_deleted = True).
    
    **Permissão**: Apenas ADMIN
    """
    # Verificar permissão
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem remover alunos de turmas"
        )
    
    # Buscar matrícula
    result = await session.execute(
        select(AlunoTurma).where(
            AlunoTurma.id == id_alunoTurma,
            AlunoTurma.is_deleted == False
        )
    )
    alunoTurma = result.scalar_one_or_none()
    
    if not alunoTurma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matrícula não encontrada"
        )
    
    # Soft delete
    alunoTurma.is_deleted = True
    alunoTurma.deleted_at = datetime.utcnow()
    alunoTurma.atualizado_em = datetime.utcnow()
    
    await session.commit()
    
    return None


@router.get(
    "/aluno/{aluno_id}/turmas",
    response_model=AlunoTurmaListResponse,
    summary="Listar turmas de um aluno"
)
async def get_turmas_do_aluno(
    aluno_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar todas as turmas em que um aluno está matriculado.
    
    **Permissão**: ADMIN, PROFESSOR e ALUNO
    """
    # Verificar se aluno existe
    result = await session.execute(
        select(Aluno).where(
            Aluno.id_aluno == aluno_id,
            Aluno.is_deleted == False
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Buscar matrículas do aluno
    query = select(AlunoTurma).where(
        AlunoTurma.id_aluno == aluno_id,
        AlunoTurma.is_deleted == False
    )
    
    # Contar total
    count_query = select(func.count()).select_from(AlunoTurma).where(
        AlunoTurma.id_aluno == aluno_id,
        AlunoTurma.is_deleted == False
    )
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Buscar com paginação
    query = query.offset(offset).limit(limit).order_by(AlunoTurma.criado_em.desc())
    result = await session.execute(query)
    matriculas = result.scalars().all()
    
    return AlunoTurmaListResponse(
        items=matriculas,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get(
    "/turma/{turma_id}/alunos",
    response_model=AlunoTurmaListResponse,
    summary="Listar alunos de uma turma"
)
async def get_alunos_da_turma(
    turma_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Listar todos os alunos matriculados em uma turma.
    
    **Permissão**: ADMIN, PROFESSOR e ALUNO
    """
    # Verificar se turma existe
    result = await session.execute(
        select(Turma).where(
            Turma.id_turma == turma_id,
            Turma.is_deleted == False
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    
    # Buscar matrículas da turma
    query = select(AlunoTurma).where(
        AlunoTurma.id_turma == turma_id,
        AlunoTurma.is_deleted == False
    )
    
    # Contar total
    count_query = select(func.count()).select_from(AlunoTurma).where(
        AlunoTurma.id_turma == turma_id,
        AlunoTurma.is_deleted == False
    )
    result = await session.execute(count_query)
    total = result.scalar()
    
    # Buscar com paginação
    query = query.offset(offset).limit(limit).order_by(AlunoTurma.criado_em.desc())
    result = await session.execute(query)
    matriculas = result.scalars().all()
    
@router.get(
    "/turma/{turma_id}/alunos-detalhado",
    response_model=List[AlunoTurmaSimpleResponse],
    summary="Listar alunos da turma com detalhes (Dados Otimizados)"
)
async def get_alunos_da_turma_detalhado(
    turma_id: int,
    # offset: int = Query(0, ge=0),
    # limit: int = Query(10, ge=1, le=100),
    nome_aluno: str = Query(None, description="Filtrar por nome dentro da turma"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Lista alunos de uma turma específica com dados unificados + Disciplina.
    """
    
    # Verificar se turma existe
    result = await session.execute(
        select(Turma).where(
            Turma.id_turma == turma_id,
            Turma.is_deleted == False
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    
    # Construção da Query Otimizada
    # ATENÇÃO: A ordem aqui deve ser a mesma do desempacotamento no loop for abaixo
    query = (
        select(
            AlunoTurma.id.label("id_alunoTurma"),
            Aluno.id_aluno,
            Aluno.nome.label("nome_aluno"),
            Aluno.matricula,
            Turma.id_turma,
            Turma.nome.label("turma_nome"),
            Turma.serie.label("turma_serie"),
            Disciplina.nome.label("disciplina_nome"), # Adicionado aqui
            Professor.id_professor,
            Professor.nome.label("nome_professor"),
            Professor.email.label("email_professor")
        )
        .select_from(AlunoTurma)
        .join(Aluno, AlunoTurma.id_aluno == Aluno.id_aluno)
        .join(Turma, AlunoTurma.id_turma == Turma.id_turma)
        # Join com Disciplina (usamos outerjoin para garantir que traga a turma mesmo se a disciplina for nula, por segurança)
        .outerjoin(Disciplina, Turma.id_disciplina == Disciplina.id_disciplina)
        .outerjoin(Professor, Turma.id_professor == Professor.id_professor)
        .outerjoin(User, Professor.id_usuario == User.id)
        .where(
            AlunoTurma.id_turma == turma_id,
            AlunoTurma.is_deleted == False,
            Aluno.is_deleted == False,
            Turma.is_deleted == False
        )
    )

    # Filtro Opcional por nome do aluno
    if nome_aluno:
        query = query.where(Aluno.nome.ilike(f"%{nome_aluno}%"))

    # Ordenação
    query = query.order_by(Aluno.nome.asc()) 
    # .offset(offset).limit(limit)

    # Execução
    result = await session.execute(query)
    rows = result.all()

    # Montagem da Resposta
    lista_retorno = []
    for row in rows:
        # O Python desempacota na ordem exata do SELECT lá em cima
        (
            id_alunoTurma,
            id_aluno, 
            n_aluno, 
            mat, 
            id_turma, 
            t_nome, 
            t_serie, 
            disc_nome,   # Disciplina entra aqui na ordem
            id_prof, 
            n_prof, 
            email_prof
        ) = row
        
        lista_retorno.append(AlunoTurmaSimpleResponse(
            id_alunoTurma=id_alunoTurma,
            id_aluno=id_aluno,
            nome_aluno=n_aluno,
            matricula=mat,
            id_turma=id_turma,
            turma_nome=t_nome,
            turma_serie=t_serie,
            disciplina_nome=disc_nome, # Mapeando
            id_professor=id_prof,
            nome_professor=n_prof,
            email_professor=email_prof
        ))

    return lista_retorno