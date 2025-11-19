# 🔐 Sistema de Autenticação JWT - CETA Trajano

## 📋 Como Funciona

O sistema usa **JWT (JSON Web Tokens)** para autenticação. Após o login, você recebe um token que contém informações sobre o usuário (scopes).

## 🎯 Scopes do Token

O **access_token** contém as seguintes informações:

```json
{
  "sub": "1",                          // ID do usuário
  "email": "admin@escola.com",         // E-mail
  "nome": "Administrador do Sistema",  // Nome completo
  "perfil": "ADMIN",                   // Role (ADMIN, PROFESSOR, ALUNO)
  "iat": "2025-11-19T10:30:00",       // Data de criação (issued at)
  "exp": "2025-11-19T11:00:00",       // Data de expiração (30 min)
  "type": "access"                     // Tipo do token
}
```

## 🔄 Fluxo de Autenticação

### 1️⃣ Login (Obter Token)

**Endpoint:** `POST /api/v1/auth/login`

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escola.com",
    "senha": "admin123"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 2️⃣ Usar o Token (Acessar Recursos)

Para acessar endpoints protegidos, envie o token no header **Authorization**:

```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**No Swagger UI:**
1. Clique no botão **"Authorize"** (cadeado 🔓)
2. Cole apenas o **access_token** (sem "Bearer")
3. Clique em **"Authorize"**
4. Agora pode testar os endpoints protegidos!

### 3️⃣ Ver Informações do Token (Scopes)

**Endpoint:** `GET /api/v1/auth/me/token`

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me/token" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Resposta:**
```json
{
  "user_id": 1,
  "email": "admin@escola.com",
  "nome": "Administrador do Sistema",
  "perfil": "ADMIN",
  "data_acesso": "2025-11-19T10:30:00"
}
```

### 4️⃣ Renovar Token (Refresh)

Quando o **access_token** expirar (30 min), use o **refresh_token** para obter um novo:

**Endpoint:** `POST /api/v1/auth/refresh`

```bash
curl -X POST "http://localhost:8000/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Resposta:**
```json
{
  "access_token": "NOVO_ACCESS_TOKEN...",
  "refresh_token": "NOVO_REFRESH_TOKEN...",
  "token_type": "bearer"
}
```

## 🛡️ Diferenças entre Access Token e Refresh Token

| Característica | Access Token | Refresh Token |
|----------------|--------------|---------------|
| **Duração** | 30 minutos | 7 dias |
| **Uso** | Acessar recursos protegidos | Renovar access_token |
| **Contém** | Todas as informações do usuário | Apenas ID do usuário |
| **Onde enviar** | Header `Authorization: Bearer <token>` | Body do endpoint `/refresh` |

## 📚 Swagger UI - Como Testar

### Método Simples (Recomendado)

1. Acesse: http://localhost:8000/docs
2. Faça login no endpoint `POST /api/v1/auth/login`
3. Copie o **access_token** da resposta
4. Clique no botão **"Authorize"** (cadeado no topo da página)
5. Cole o token (sem "Bearer")
6. Clique em **"Authorize"**
7. Pronto! Agora pode testar todos os endpoints protegidos

### Verificar Informações do Token

- Use o endpoint `GET /api/v1/auth/me/token` para ver:
  - Nome do usuário logado
  - Perfil (ADMIN, PROFESSOR, ALUNO)
  - Data de criação do token
  - E-mail

## 🔒 Segurança

- ✅ Token expira em 30 minutos (access)
- ✅ Refresh token expira em 7 dias
- ✅ Senha nunca é enviada no token
- ✅ Token assinado com chave secreta (HS256)
- ✅ Validação automática em toda requisição
- ✅ Usuários inativos não conseguem autenticar

## 🎯 Níveis de Acesso (RBAC)

### 🔴 ADMIN
- Criar, editar e deletar usuários
- Acesso total ao sistema
- Criar professores e alunos

### 🟡 PROFESSOR
- Gerenciar turmas
- Lançar notas
- Controlar presença

### 🟢 ALUNO
- Ver notas próprias
- Ver frequência própria
- Consultar informações pessoais

## ⚠️ Erros Comuns

### 401 Unauthorized
- Token expirado → Use o refresh_token
- Token inválido → Faça login novamente
- Token não enviado → Adicione no header Authorization

### 403 Forbidden
- Usuário sem permissão → Verifique o perfil necessário
- Usuário inativo → Entre em contato com o admin

## 💡 Dicas

1. **Guarde o refresh_token** em local seguro (nunca no localStorage do navegador!)
2. **Renove automaticamente** quando o access_token estiver próximo de expirar
3. **Logout**: Apenas delete os tokens do cliente (stateless)
4. **No Postman/Insomnia**: Use variáveis de ambiente para armazenar os tokens

## 📝 Exemplo Completo com JavaScript

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@escola.com',
    senha: 'admin123'
  })
});

const { access_token, refresh_token } = await loginResponse.json();

// 2. Usar o token
const response = await fetch('http://localhost:8000/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

// 3. Ver informações do token
const tokenInfo = await fetch('http://localhost:8000/api/v1/auth/me/token', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const userInfo = await tokenInfo.json();
console.log(`Usuário: ${userInfo.nome} (${userInfo.perfil})`);
```

## 🔗 Links Úteis

- **Documentação Swagger**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **JWT.io** (decodificar tokens): https://jwt.io
