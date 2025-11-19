# ✅ Autenticação Refatorada - PyJWT

## Mudanças Implementadas

### 1. **Biblioteca JWT**
- ❌ Removido: `python-jose`
- ✅ Adicionado: `PyJWT 2.9.0` (mais simples e direto)

### 2. **Chaves de Segurança** (`.env`)
```env
# Configurações de segurança JWT (Geradas com secrets.token_urlsafe(32))
SECRET_KEY=9b4DY4vbXDjEj96Un-FIEuZ9WPdFVrGUVf96AVMWY-w
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# API Key para autenticação de serviços externos
API_KEY=tygbKAKPmsPG80WUyECfFicM6qRxxP8JA7p9FrCq4CU
```

### 3. **app/core/security.py** - Totalmente Refeito
- ✅ `import jwt` (PyJWT) ao invés de `from jose import jwt`
- ✅ `HTTPBearer` ao invés de `OAuth2PasswordBearer`
- ✅ Funções JWT simplificadas:
  - `create_access_token()` - Cria token com scopes
  - `create_refresh_token()` - Token de renovação
  - `decode_token()` - Decodifica e valida
- ✅ Exceções do PyJWT:
  - `jwt.ExpiredSignatureError` - Token expirado
  - `jwt.InvalidTokenError` - Token inválido
- ✅ Dependências de autenticação:
  - `get_current_user()` - Extrai usuário do token
  - `get_current_active_admin()` - Valida se é ADMIN
  - `verify_api_key()` - Valida API Key para integrações

### 4. **app/core/config.py**
- ✅ Adicionado campo `API_KEY: str`

### 5. **app/routers/auth.py** - Corrigido
- ✅ `import jwt` (PyJWT)
- ✅ Removido `from jose import JWTError, jwt`
- ✅ Substituído `require_role("ADMIN")` por `get_current_active_admin`
- ✅ Substituído `JWTError` por `jwt.ExpiredSignatureError, jwt.InvalidTokenError`
- ✅ Usa `decode_token()` centralizado

### 6. **Token JWT - Estrutura**

**Access Token (30 minutos):**
```json
{
  "sub": "1",                          // ID do usuário
  "email": "admin@escola.com",         // E-mail
  "nome": "Administrador",             // Nome completo
  "perfil": "ADMIN",                   // Role
  "iat": "2025-11-19T10:30:00",       // Data de criação
  "exp": 1732021800,                   // Timestamp de expiração
  "type": "access"                     // Tipo
}
```

**Refresh Token (7 dias):**
```json
{
  "sub": "1",              // ID do usuário
  "exp": 1732626600,       // Timestamp de expiração
  "type": "refresh"        // Tipo
}
```

## Como Testar

### 1. Iniciar o servidor:
```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Acessar Swagger UI:
```
http://localhost:8000/docs
```

### 3. Fazer Login:
```bash
POST /api/v1/auth/login
{
  "email": "admin.wag@gmail.com",
  "senha": "sua_senha"
}
```

### 4. Copiar o access_token e clicar em "Authorize" 🔓

### 5. Testar o endpoint de informações do token:
```bash
GET /api/v1/auth/me/token
```

## Vantagens do PyJWT

✅ **Mais simples** - Menos dependências e código mais limpo  
✅ **Mais rápido** - Performance melhor que python-jose  
✅ **Mais popular** - 5x mais downloads no PyPI  
✅ **Mais seguro** - Mantido ativamente com patches de segurança  
✅ **Exceções claras** - `ExpiredSignatureError` e `InvalidTokenError` são autoexplicativas  

## Próximos Passos

- [ ] Testar login e autenticação
- [ ] Verificar scopes do token no `/me/token`
- [ ] Testar refresh token
- [ ] Implementar CRUD completo de usuários
- [ ] Adicionar roles específicos para endpoints
