# 🎓 Sistema de Gerenciamento Escolar - Backend

Sistema completo de gerenciamento escolar desenvolvido com **FastAPI**, **PostgreSQL** e autenticação **JWT**.

## 📋 Stack Tecnológica

- **Python 3.11+**
- **FastAPI** - Framework web moderno e rápido
- **PostgreSQL** - Banco de dados relacional
- **SQLModel** - ORM assíncrono com Pydantic
- **JWT** - Autenticação com tokens (scopes: user_id, email, nome, perfil, data_acesso)
- **Bcrypt** - Hash seguro de senhas
- **Passlib** - Biblioteca de criptografia

> 📖 **[Guia Completo de Autenticação JWT](AUTHENTICATION.md)** - Como funciona o sistema de tokens, scopes, refresh e OAuth2

## 🏗️ Arquitetura do Projeto

```
back_python/
├── app/
│   ├── core/              # Configurações e segurança
│   │   ├── config.py      # Variáveis de ambiente
│   │   └── security.py    # JWT, bcrypt, dependências
│   ├── database/          # Configuração do banco
│   │   ├── session.py     # Engine e sessões
│   │   └── init_db.py     # Criação de tabelas
│   ├── models/            # Modelos SQLModel
│   │   └── user.py        # Modelo User com Enum de Roles
│   ├── schemas/           # Schemas Pydantic
│   │   ├── user.py        # DTOs de usuário
│   │   └── auth.py        # DTOs de autenticação
│   ├── routers/           # Endpoints da API
│   │   ├── auth.py        # Login, signup, refresh
│   │   └── users.py       # CRUD de usuários
│   └── main.py            # Aplicação principal
├── .env                   # Variáveis de ambiente (criar)
├── .env.example           # Exemplo de configuração
├── requirements.txt       # Dependências
└── README.md             # Este arquivo
```

## 🚀 Como Executar

### 1. Pré-requisitos

- Python 3.11+
- PostgreSQL 14+
- pip ou poetry

### 2. Instalar Dependências

```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # macOS/Linux

# Instalar dependências
pip install -r requirements.txt
```

### 3. Configurar Banco de Dados

Crie um banco PostgreSQL:

```sql
CREATE DATABASE school_db;
```

### 4. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e ajuste as configurações:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/school_db
SECRET_KEY=seu-secret-key-aqui-mude-em-producao
```

**⚠️ IMPORTANTE:** Em produção, gere uma SECRET_KEY segura:

```bash
openssl rand -hex 32
```

### 5. Executar a Aplicação

```bash
uvicorn app.main:app --reload
```

A API estará disponível em: `http://localhost:8000`

## 📚 Documentação da API

Após executar, acesse:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Autenticação e Autorização

> 📖 **[Guia Completo de Autenticação JWT](AUTHENTICATION.md)** - Leia aqui para entender como funciona todo o sistema de tokens!

### Perfis de Usuário (Roles)

O sistema possui 3 perfis:

- **🔴 ADMIN** - Acesso total ao sistema (pode criar outros usuários)
- **🟡 PROFESSOR** - Gerenciamento de turmas e notas
- **🟢 ALUNO** - Visualização de dados pessoais

### Fluxo Simplificado

1. **Sign-up** (`POST /api/v1/auth/signup`) - ⚠️ **Apenas ADMIN pode criar usuários**
   - Senha é hasheada com bcrypt (limite de 72 bytes)
   - Valida e-mail único

2. **Login** (`POST /api/v1/auth/login`)
   - Valida credenciais
   - Retorna `access_token` (30 min) e `refresh_token` (7 dias)
   - Token JWT contém scopes: **user_id, email, nome, perfil, data_acesso**

3. **Ver Token** (`GET /api/v1/auth/me/token`)
   - Decodifica e mostra as informações do token atual
   - Retorna: user_id, email, nome, perfil, data_acesso

4. **Refresh Token** (`POST /api/v1/auth/refresh`)
   - Renova o access_token sem fazer login novamente

5. **Rotas Protegidas**
   - Use o header: `Authorization: Bearer <access_token>`

### Exemplo de Uso

```bash
# IMPORTANTE: Para criar o primeiro usuário ADMIN, use o script:
python create_admin.py

# 1. Fazer login como ADMIN
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escola.com",
    "senha": "admin123"
  }'

# Copie o access_token retornado

# 2. Ver informações do token (scopes)
curl -X GET "http://localhost:8000/api/v1/auth/me/token" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"

# 3. Criar novo usuário (apenas ADMIN)
curl -X POST "http://localhost:8000/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI" \
  -d '{
    "email": "professor@escola.com",
    "nome_completo": "Professor Silva",
    "perfil": "PROFESSOR",
    "senha": "senha123"
  }'

# 3. Acessar rota protegida
curl -X GET "http://localhost:8000/api/v1/users/admin-only" \
  -H "Authorization: Bearer <seu-access-token>"
```

## 🔒 Recursos de Segurança Implementados

✅ **Hash de Senhas** - Bcrypt com salt automático (máximo 72 caracteres)  
✅ **JWT com Refresh Token** - Tokens de curta e longa duração  
✅ **Soft Delete** - Preserva histórico (campo `ativo`)  
✅ **CORS** - Proteção contra requisições de origens não autorizadas  
✅ **Validação de Senha** - Mínimo 6, máximo 72 caracteres, letras e números  
✅ **Role-Based Access Control (RBAC)** - Autorização por perfil  
✅ **Validação de E-mail** - Garante unicidade  
✅ **Criação de Contas Restrita** - Apenas ADMIN pode criar usuários

## 📝 Endpoints Principais

### Autenticação

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/v1/auth/signup` | Criar novo usuário | **ADMIN** |
| POST | `/api/v1/auth/login` | Login e obter tokens | Não |
| POST | `/api/v1/auth/refresh` | Renovar access_token | Sim (refresh_token) |

### Usuários

| Método | Endpoint | Descrição | Autorização |
|--------|----------|-----------|-------------|
| GET | `/api/v1/users/me` | Dados do usuário logado | Qualquer autenticado |
| GET | `/api/v1/users/` | Listar todos usuários | ADMIN |
| GET | `/api/v1/users/admin-only` | Rota exemplo ADMIN | ADMIN |
| DELETE | `/api/v1/users/{id}` | Desativar usuário | ADMIN |

## 🧪 Testando a API

### 1. Criar um usuário ADMIN

```json
POST /api/v1/auth/signup
{
  "email": "admin@escola.com",
  "full_name": "Administrador",
  "role": "ADMIN",
  "password": "admin123"
}
```

### 2. Fazer login

```json
POST /api/v1/auth/login
{
  "email": "admin@escola.com",
  "password": "admin123"
}
```

### 3. Acessar rota protegida

```
GET /api/v1/users/admin-only
Authorization: Bearer <seu-access-token>
```

## 🎯 Próximos Passos

- [ ] Implementar gestão de turmas
- [ ] Sistema de notas e avaliações
- [ ] Controle de presença
- [ ] Upload de documentos
- [ ] Notificações por e-mail
- [ ] Relatórios em PDF
- [ ] Testes automatizados
- [ ] Docker e CI/CD

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

Desenvolvido com ❤️ usando FastAPI
