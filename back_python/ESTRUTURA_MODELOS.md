# Sistema Escolar - Estrutura de Modelos e Routers

## 📋 Visão Geral

Esta documentação descreve a implementação completa da camada de negócios do sistema escolar, incluindo:
- ✅ Modelos ORM (SQLModel)
- ✅ Schemas Pydantic
- ✅ Routers com CRUD completo
- ✅ **Soft Delete em todas as tabelas**
- ✅ **Paginação em todos os endpoints GET**
- ✅ Controle de permissões por perfil

## 🗂️ Estrutura de Arquivos Criados

```
back_python/app/
├── models/
│   ├── __init__.py          # Exporta todos os modelos
│   ├── user.py              # ✅ Já existia (atualizado com relationships)
│   ├── aluno.py             # ✅ NOVO
│   ├── professor.py         # ✅ NOVO
│   ├── disciplina.py        # ✅ NOVO
│   ├── turma.py             # ✅ NOVO
│   ├── aluno_turma.py       # ✅ NOVO (tabela N:N)
│   ├── noticia.py           # ✅ NOVO
│   ├── evento.py            # ✅ NOVO
│   ├── galeria.py           # ✅ NOVO
│   └── calendario.py        # ✅ NOVO
│
├── schemas/
│   ├── __init__.py
│   ├── user.py              # ✅ Já existia
│   ├── aluno.py             # ✅ NOVO
│   ├── professor.py         # ✅ NOVO
│   ├── disciplina.py        # ✅ NOVO
│   ├── turma.py             # ✅ NOVO
│   ├── aluno_turma.py       # ✅ NOVO
│   ├── noticia.py           # ✅ NOVO
│   ├── evento.py            # ✅ NOVO
│   ├── galeria.py           # ✅ NOVO
│   └── calendario.py        # ✅ NOVO
│
└── routers/
    ├── __init__.py
    ├── auth.py              # ✅ Já existia
    ├── users.py             # ✅ Já existia
    ├── alunos.py            # ✅ NOVO (exemplo completo)
    ├── noticias.py          # ✅ NOVO (exemplo completo)
    └── galeria.py           # ✅ NOVO (exemplo completo com Base64)
```

## 🔐 Regra de Ouro: Soft Delete

### O que é Soft Delete?

**NENHUM registro é apagado fisicamente do banco de dados**. Todos os modelos possuem:

```python
# Campos de controle em TODOS os modelos
is_deleted: bool = Field(default=False)
deleted_at: Optional[datetime] = None
```

### Como funciona?

1. **DELETE (Soft)**: Marca `is_deleted = True` e define `deleted_at`
2. **GET (Listagem)**: Retorna apenas `is_deleted = False`
3. **GET (Por ID)**: Busca apenas `is_deleted = False`

### Exemplo de implementação:

```python
# DELETE - Soft Delete
@router.delete("/{id}")
async def delete_item(id: int, session: AsyncSession = Depends(get_session)):
    item.is_deleted = True
    item.deleted_at = datetime.utcnow()
    await session.commit()

# GET - Filtra apenas não deletados
@router.get("/")
async def list_items(session: AsyncSession = Depends(get_session)):
    query = select(Model).where(Model.is_deleted == False)
    # ...
```

## 📄 Paginação

Todos os endpoints de listagem aceitam:

- `offset`: Número de registros a pular (padrão: 0)
- `limit`: Número máximo de registros (padrão: 10, máximo: 100)

### Exemplo de uso:

```bash
# Primeira página (10 registros)
GET /api/alunos?offset=0&limit=10

# Segunda página
GET /api/alunos?offset=10&limit=10

# 50 registros por página
GET /api/alunos?offset=0&limit=50
```

### Resposta paginada:

```json
{
  "items": [...],
  "total": 156,
  "offset": 0,
  "limit": 10
}
```

## 👥 Controle de Permissões

### Perfis do Sistema

| Perfil | Descrição |
|--------|-----------|
| **ADMIN** | Acesso total ao sistema |
| **PROFESSOR** | Pode gerenciar notícias, eventos e turmas |
| **ALUNO** | Acesso apenas aos próprios dados |

### Matriz de Permissões

| Recurso | GET (Listar) | GET (ID) | POST | PUT | DELETE |
|---------|--------------|----------|------|-----|--------|
| **Alunos** | ADMIN, PROF, ALUNO* | ADMIN, PROF, ALUNO* | ADMIN | ADMIN | ADMIN |
| **Professores** | ADMIN, PROF | ADMIN, PROF | ADMIN | ADMIN | ADMIN |
| **Disciplinas** | Todos | Todos | ADMIN | ADMIN | ADMIN |
| **Turmas** | Todos | Todos | ADMIN | ADMIN | ADMIN |
| **Notícias** | Todos | Todos | ADMIN, PROF | ADMIN, PROF | ADMIN, PROF |
| **Eventos** | Todos | Todos | ADMIN, PROF | ADMIN, PROF | ADMIN, PROF |
| **Galeria** | Todos | Todos | ADMIN, PROF | ADMIN, PROF | ADMIN, PROF |
| **Calendário** | Todos | Todos | ADMIN, PROF | ADMIN, PROF | ADMIN, PROF |

\* **ALUNO** só pode ver seus próprios dados

## 🗄️ Modelos e Relacionamentos

### Diagrama de Relacionamentos

```
User (usuarios)
 ├── 1:1 → Aluno
 └── 1:1 → Professor

Aluno
 └── N:N → Turma (via AlunoTurma)

Professor
 └── 1:N → Turma

Disciplina
 └── 1:N → Turma

Turma
 ├── N:1 → Professor
 ├── N:1 → Disciplina
 └── N:N → Aluno (via AlunoTurma)

Evento
 └── 1:N → Galeria

Noticia (independente)
Calendario (independente)
```

### Correção de Chaves Estrangeiras

⚠️ **Atenção**: No SQL fornecido, havia inconsistências nas referências:
- SQL: `id_usuario` na tabela `usuario`, mas referências usavam `id_usuario`
- **Correção**: Modelos usam `id` na tabela User, referências corretas em Aluno/Professor

```python
# Tabela User
class User(SQLModel, table=True):
    __tablename__ = "usuarios"
    id: Optional[int] = Field(default=None, primary_key=True)  # ✅

# Tabelas filhas referenciam corretamente
class Aluno(SQLModel, table=True):
    id_usuario: int = Field(foreign_key="usuarios.id", unique=True)  # ✅
```

## 📸 Tratamento de Imagens (Galeria)

A tabela `galeria` armazena imagens como **BYTEA** no PostgreSQL.

### Envio de Imagem (POST/PUT):

```json
{
  "id_evento": 1,
  "descricao": "Festa Junina",
  "imagem_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA..."
}
```

### Recuperação de Imagem:

```bash
# Metadados (sem imagem)
GET /api/galeria/1

# Imagem completa em Base64
GET /api/galeria/1/image
```

### Implementação no Router:

```python
# Converter Base64 → bytes (ao salvar)
imagem_bytes = base64.b64decode(galeria_data.imagem_base64)

# Converter bytes → Base64 (ao retornar)
imagem_base64 = base64.b64encode(galeria.imagem).decode('utf-8')
```

## 🚀 Próximos Passos

### 1. Criar Routers Restantes

Baseie-se nos exemplos de `alunos.py`, `noticias.py` e `galeria.py` para criar:

- `app/routers/professores.py`
- `app/routers/disciplinas.py`
- `app/routers/turmas.py`
- `app/routers/aluno_turma.py`
- `app/routers/eventos.py`
- `app/routers/calendario.py`

### 2. Registrar Routers no `main.py`

```python
from app.routers import (
    auth, users, alunos, professores, disciplinas,
    turmas, aluno_turma, noticias, eventos, galeria, calendario
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(alunos.router)
app.include_router(professores.router)
app.include_router(disciplinas.router)
app.include_router(turmas.router)
app.include_router(aluno_turma.router)
app.include_router(noticias.router)
app.include_router(eventos.router)
app.include_router(galeria.router)
app.include_router(calendario.router)
```

### 3. Criar e Aplicar Migrações

```bash
# Gerar migração
alembic revision --autogenerate -m "Add business tables"

# Aplicar migração
alembic upgrade head
```

### 4. Testar Endpoints

Use o Swagger UI automático do FastAPI:

```
http://localhost:8000/docs
```

## 📝 Exemplos de Uso

### Criar Aluno (ADMIN)

```bash
POST /api/alunos
Authorization: Bearer {token_admin}

{
  "id_usuario": 5,
  "matricula": "2025001",
  "nome": "João Silva Santos",
  "data_nascimento": "2010-05-15",
  "endereco": "Rua das Flores, 123",
  "telefone": "(11) 98765-4321"
}
```

### Listar Alunos com Paginação

```bash
GET /api/alunos?offset=0&limit=20
Authorization: Bearer {token}
```

### Soft Delete de Aluno (ADMIN)

```bash
DELETE /api/alunos/1
Authorization: Bearer {token_admin}
```

### Criar Notícia (PROFESSOR)

```bash
POST /api/noticias
Authorization: Bearer {token_professor}

{
  "titulo": "Início do Ano Letivo",
  "conteudo": "As aulas começam em 10/02/2025",
  "data": "2025-01-15"
}
```

## ⚠️ Observações Importantes

1. **Nome da tabela User**: A tabela se chama `usuarios` no banco (não `usuario`)
2. **Soft Delete obrigatório**: Todos os endpoints DELETE fazem soft delete
3. **Paginação obrigatória**: Todos os endpoints de listagem têm paginação
4. **Imagens em Base64**: A galeria usa Base64 para trafegar imagens
5. **Timestamps automáticos**: `criado_em` e `atualizado_em` são gerenciados automaticamente

## 🔧 Configuração de Ambiente

Certifique-se de que o `.env` contém:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/escola_db
SECRET_KEY=your-secret-key-here
API_KEY=your-api-key-here
```

## 📚 Documentação Adicional

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLModel Docs](https://sqlmodel.tiangolo.com/)
- [Pydantic Docs](https://docs.pydantic.dev/)

---

**Desenvolvido com ❤️ para o Sistema Escolar CETA Trajano**
