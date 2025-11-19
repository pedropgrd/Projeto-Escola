# 🚀 GUIA DE INÍCIO RÁPIDO

## ⚡ Executar a Aplicação (SEM Docker)

Se você não tem PostgreSQL instalado, pode usar SQLite temporariamente:

### 1. Editar `.env` para usar SQLite

```env
# Comente a linha do PostgreSQL e adicione:
```

### 2. Instalar driver SQLite

```bash
pip install aiosqlite
```

### 3. Executar a aplicação

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Executar servidor
uvicorn app.main:app --reload
```

## 🐘 Executar com PostgreSQL (Recomendado)

### Opção A: Docker (Mais fácil)

```bash
# Instalar Docker Desktop do site oficial
# Então executar:
docker run --name ceta_trajano_postgres \
  -e POSTGRES_USER=trajano_user \
  -e POSTGRES_PASSWORD=trajano_pass2025 \
  -e POSTGRES_DB=CETA_TRAJANO_ALM \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Opção B: PostgreSQL Local

1. Instalar PostgreSQL: https://postgresapp.com/ (macOS)
2. Criar banco:
   ```sql
   CREATE DATABASE CETA_TRAJANO_ALM;
   CREATE USER trajano_user WITH PASSWORD 'trajano_pass2025';
   GRANT ALL PRIVILEGES ON DATABASE CETA_TRAJANO_ALM TO trajano_user;
   ```

## 📚 Acessar Documentação

Após executar, acesse:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Criar o Primeiro Usuário ADMIN

**IMPORTANTE:** Apenas administradores podem criar contas. Execute este script para criar o primeiro ADMIN:

```bash
# Ative o ambiente virtual
source .venv/bin/activate

# Execute o script de criação do admin
python create_admin.py
```

O script vai pedir:
- E-mail do admin
- Nome completo
- Senha (mínimo 6 caracteres)

## 🧪 Testar a API

### 1. Fazer Login como ADMIN

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escola.com",
    "senha": "admin123"
  }'
```

Copie o `access_token` retornado.

### 2. Criar novo usuário (apenas ADMIN)

```bash
curl -X POST "http://localhost:8000/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI" \
  -d '{
    "email": "professor@escola.com",
    "nome_completo": "Professor Silva",
    "perfil": "PROFESSOR",
    "senha": "senha123"
  }'
```

### 3. Acessar rota protegida

```bash
curl -X GET "http://localhost:8000/api/v1/users/admin-only" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## ⚙️ Configuração do .env

```env
# SQLite (para desenvolvimento local sem PostgreSQL)
DATABASE_URL=sqlite+aiosqlite:///./CETA_TRAJANO_ALM.db

# OU PostgreSQL (produção)
DATABASE_URL=postgresql+asyncpg://trajano_user:trajano_pass2025@localhost:5432/CETA_TRAJANO_ALM

# JWT (não mude em produção!)
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
APP_NAME="Sistema de Gerenciamento Escolar"
DEBUG=True
```

## 📦 Estrutura de Pastas

```
back_python/
├── app/
│   ├── core/          # Segurança e configurações
│   ├── database/      # PostgreSQL/SQLite
│   ├── models/        # Tabelas (User)
│   ├── schemas/       # DTOs Pydantic
│   ├── routers/       # Endpoints
│   └── main.py        # App principal
├── venv/              # Ambiente virtual
├── .env               # Variáveis de ambiente
├── requirements.txt   # Dependências
└── README.md          # Documentação
```

## 🔐 Segurança

✅ Senhas hasheadas com bcrypt  
✅ JWT com refresh token  
✅ CORS configurado  
✅ Soft delete (is_active)  
✅ RBAC (ADMIN, PROFESSOR, ALUNO)

## 🎯 Próximos Passos

1. ✅ Sistema de autenticação (FEITO!)
2. 🔲 CRUD de Alunos
3. 🔲 CRUD de Turmas
4. 🔲 Sistema de Notas
5. 🔲 Controle de Presença
6. 🔲 Relatórios

## 📞 Suporte

Para dúvidas, consulte:
- Documentação FastAPI: https://fastapi.tiangolo.com
- SQLModel: https://sqlmodel.tiangolo.com
- JWT: https://jwt.io
