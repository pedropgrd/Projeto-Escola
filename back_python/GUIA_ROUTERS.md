# Guia Rápido: Criando os Routers Restantes

## 🎯 Objetivo

Este guia ajuda a criar rapidamente os routers restantes seguindo o mesmo padrão dos exemplos.

## 📋 Routers a Implementar

- [x] `alunos.py` ✅ (COMPLETO - Exemplo)
- [x] `noticias.py` ✅ (COMPLETO - Exemplo)
- [x] `galeria.py` ✅ (COMPLETO - Exemplo com Base64)
- [x] `turmas.py` ✅ (COMPLETO - Exemplo)
- [ ] `professores.py` (A fazer)
- [ ] `disciplinas.py` (A fazer)
- [ ] `aluno_turma.py` (A fazer)
- [ ] `eventos.py` (A fazer)
- [ ] `calendario.py` (A fazer)

## 🛠️ Template Base para Routers

### Estrutura Padrão

```python
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.session import get_session
from app.models.{model} import {Model}
from app.models.user import User, UserRole
from app.schemas.{model} import (
    {Model}Create, {Model}Update, {Model}Response, {Model}ListResponse
)
from app.core.security import get_current_user

router = APIRouter(prefix="/{models}", tags=["{Models}"])

# POST - Criar
# GET / - Listar (com paginação)
# GET /{id} - Buscar por ID
# PUT /{id} - Atualizar
# DELETE /{id} - Soft Delete
```

## 📝 Checklist de Implementação

### Para cada Router, certifique-se de:

- [ ] Importar os modelos e schemas corretos
- [ ] Definir o `prefix` e `tags` do router
- [ ] Implementar **5 endpoints básicos** (POST, GET/, GET/{id}, PUT, DELETE)
- [ ] Adicionar verificação de permissões (`current_user.perfil`)
- [ ] **SEMPRE** filtrar por `is_deleted == False` em queries
- [ ] Implementar Soft Delete (não apagar, marcar `is_deleted = True`)
- [ ] Adicionar paginação (`offset` e `limit`) no GET/
- [ ] Retornar `{Model}ListResponse` com `items`, `total`, `offset`, `limit`
- [ ] Adicionar `summary` e docstring em cada endpoint
- [ ] Tratar erros com `HTTPException` apropriado

## 🔐 Regras de Permissão por Router

### Professores

| Endpoint | Permissão |
|----------|-----------|
| POST | ADMIN |
| GET / | ADMIN, PROFESSOR |
| GET /{id} | ADMIN, PROFESSOR |
| PUT | ADMIN |
| DELETE | ADMIN |

### Disciplinas

| Endpoint | Permissão |
|----------|-----------|
| POST | ADMIN |
| GET / | Todos |
| GET /{id} | Todos |
| PUT | ADMIN |
| DELETE | ADMIN |

### Aluno_Turma (Matrícula)

| Endpoint | Permissão |
|----------|-----------|
| POST | ADMIN |
| GET / | ADMIN, PROFESSOR |
| GET /{id} | ADMIN, PROFESSOR |
| DELETE | ADMIN |

**Nota**: Não há PUT para Aluno_Turma (não se edita matrícula, remove e recria)

### Eventos

| Endpoint | Permissão |
|----------|-----------|
| POST | ADMIN, PROFESSOR |
| GET / | Todos |
| GET /{id} | Todos |
| PUT | ADMIN, PROFESSOR |
| DELETE | ADMIN, PROFESSOR |

### Calendário

| Endpoint | Permissão |
|----------|-----------|
| POST | ADMIN, PROFESSOR |
| GET / | Todos |
| GET /{id} | Todos |
| PUT | ADMIN, PROFESSOR |
| DELETE | ADMIN, PROFESSOR |

## 🚀 Exemplo Rápido: Professor Router

```python
# app/routers/professores.py

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.session import get_session
from app.models.professor import Professor
from app.models.user import User, UserRole
from app.schemas.professor import (
    ProfessorCreate, ProfessorUpdate, ProfessorResponse, ProfessorListResponse
)
from app.core.security import get_current_user

router = APIRouter(prefix="/professores", tags=["Professores"])


@router.post("/", response_model=ProfessorResponse, status_code=status.HTTP_201_CREATED)
async def create_professor(
    professor_data: ProfessorCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Criar novo professor. **Permissão**: ADMIN"""
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    professor = Professor(**professor_data.model_dump())
    session.add(professor)
    await session.commit()
    await session.refresh(professor)
    return professor


@router.get("/", response_model=ProfessorListResponse)
async def list_professores(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Listar professores. **Permissão**: ADMIN, PROFESSOR"""
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    query = select(Professor).where(Professor.is_deleted == False)
    count_query = select(func.count()).select_from(Professor).where(
        Professor.is_deleted == False
    )
    
    result = await session.execute(count_query)
    total = result.scalar()
    
    query = query.offset(offset).limit(limit).order_by(Professor.id_professor)
    result = await session.execute(query)
    professores = result.scalars().all()
    
    return ProfessorListResponse(
        items=professores, total=total, offset=offset, limit=limit
    )


@router.get("/{professor_id}", response_model=ProfessorResponse)
async def get_professor(
    professor_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Buscar professor por ID. **Permissão**: ADMIN, PROFESSOR"""
    if current_user.perfil not in [UserRole.ADMIN, UserRole.PROFESSOR]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
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


@router.put("/{professor_id}", response_model=ProfessorResponse)
async def update_professor(
    professor_id: int,
    professor_data: ProfessorUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Atualizar professor. **Permissão**: ADMIN"""
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    result = await session.execute(
        select(Professor).where(
            Professor.id_professor == professor_id,
            Professor.is_deleted == False
        )
    )
    professor = result.scalar_one_or_none()
    
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    
    update_data = professor_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(professor, field, value)
    
    professor.atualizado_em = datetime.utcnow()
    await session.commit()
    await session.refresh(professor)
    
    return professor


@router.delete("/{professor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_professor(
    professor_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Soft Delete de professor. **Permissão**: ADMIN"""
    if current_user.perfil != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    result = await session.execute(
        select(Professor).where(
            Professor.id_professor == professor_id,
            Professor.is_deleted == False
        )
    )
    professor = result.scalar_one_or_none()
    
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    
    # Soft Delete
    professor.is_deleted = True
    professor.deleted_at = datetime.utcnow()
    professor.atualizado_em = datetime.utcnow()
    
    await session.commit()
    return None
```

## 📦 Registrar Routers no `main.py`

Após criar todos os routers, adicione-os ao `main.py`:

```python
from app.routers import (
    auth,
    users,
    alunos,
    professores,
    disciplinas,
    turmas,
    aluno_turma,
    noticias,
    eventos,
    galeria,
    calendario
)

# Registrar todos os routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(alunos.router, prefix="/api")
app.include_router(professores.router, prefix="/api")
app.include_router(disciplinas.router, prefix="/api")
app.include_router(turmas.router, prefix="/api")
app.include_router(aluno_turma.router, prefix="/api")
app.include_router(noticias.router, prefix="/api")
app.include_router(eventos.router, prefix="/api")
app.include_router(galeria.router, prefix="/api")
app.include_router(calendario.router, prefix="/api")
```

## 🧪 Testar os Endpoints

1. **Inicie o servidor**:
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Acesse o Swagger**:
   ```
   http://localhost:8000/docs
   ```

3. **Faça login** para obter o token de autenticação

4. **Teste cada endpoint** usando o Swagger UI

## ⚠️ Lembretes Importantes

1. **SEMPRE** use `is_deleted == False` nas queries
2. **NUNCA** apague registros fisicamente
3. **SEMPRE** implemente paginação nos endpoints de listagem
4. **SEMPRE** verifique permissões antes de executar ações
5. **SEMPRE** retorne `HTTPException` com status code apropriado
6. Use `datetime.utcnow()` para timestamps
7. Use `session.commit()` e `session.refresh()` após alterações

## 🎓 Próximos Passos

1. Criar os 5 routers restantes
2. Registrar todos no `main.py`
3. Criar as tabelas no banco: `python app/database/create_tables.py`
4. Testar todos os endpoints no Swagger
5. Implementar testes unitários (opcional)
6. Criar documentação de API (opcional)

---

**Boa sorte! 🚀**
