# 🧪 Guia de Testes - Sistema Escolar

## 📋 Checklist de Testes

Use este guia para testar todos os endpoints da API sistematicamente.

## 🔐 1. Autenticação

### 1.1. Login como ADMIN

```bash
POST http://localhost:8000/api/auth/login

{
  "email": "admin@escola.com",
  "senha": "admin123"
}

# Resposta esperada:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@escola.com",
    "perfil": "ADMIN",
    ...
  }
}
```

✅ Copie o `access_token` e use em todos os próximos testes!

### 1.2. Testar Token Inválido

```bash
GET http://localhost:8000/api/alunos
Authorization: Bearer token_invalido

# Resposta esperada: 401 Unauthorized
```

## 👥 2. Testes de Usuários (ADMIN)

### 2.1. Criar Usuário ALUNO

```bash
POST http://localhost:8000/api/users
Authorization: Bearer {token_admin}

{
  "email": "joao.silva@aluno.escola.com",
  "nome_completo": "João Silva Santos",
  "perfil": "ALUNO",
  "senha": "senha123"
}

# Resposta: 201 Created
# Anote o ID do usuário retornado!
```

### 2.2. Criar Usuário PROFESSOR

```bash
POST http://localhost:8000/api/users
Authorization: Bearer {token_admin}

{
  "email": "maria.oliveira@prof.escola.com",
  "nome_completo": "Maria Oliveira Costa",
  "perfil": "PROFESSOR",
  "senha": "prof123"
}

# Anote o ID!
```

### 2.3. Listar Usuários com Paginação

```bash
GET http://localhost:8000/api/users?offset=0&limit=10
Authorization: Bearer {token_admin}

# Resposta esperada: Lista paginada
{
  "items": [...],
  "total": 3,
  "offset": 0,
  "limit": 10
}
```

## 🎓 3. Testes de Alunos

### 3.1. Criar Aluno (ADMIN)

```bash
POST http://localhost:8000/api/alunos
Authorization: Bearer {token_admin}

{
  "id_usuario": 2,  # ID do usuário ALUNO criado anteriormente
  "matricula": "2025001",
  "nome": "João Silva Santos",
  "data_nascimento": "2010-05-15",
  "endereco": "Rua das Flores, 123",
  "telefone": "(11) 98765-4321"
}

# Resposta: 201 Created
# Anote o id_aluno!
```

### 3.2. Listar Alunos (Todos os perfis)

```bash
# Como ADMIN - vê todos
GET http://localhost:8000/api/alunos?offset=0&limit=10
Authorization: Bearer {token_admin}

# Como ALUNO - vê apenas seus dados
GET http://localhost:8000/api/alunos
Authorization: Bearer {token_aluno}
```

### 3.3. Buscar Aluno por ID

```bash
GET http://localhost:8000/api/alunos/1
Authorization: Bearer {token_admin}

# Resposta: 200 OK com dados do aluno
```

### 3.4. Atualizar Aluno (ADMIN)

```bash
PUT http://localhost:8000/api/alunos/1
Authorization: Bearer {token_admin}

{
  "telefone": "(11) 91234-5678",
  "endereco": "Av. Nova, 456"
}

# Resposta: 200 OK com dados atualizados
```

### 3.5. Soft Delete de Aluno (ADMIN)

```bash
DELETE http://localhost:8000/api/alunos/1
Authorization: Bearer {token_admin}

# Resposta: 204 No Content

# Verificar que não aparece mais na listagem
GET http://localhost:8000/api/alunos
# O aluno não deve aparecer!
```

### 3.6. Teste de Permissão (ALUNO não pode criar)

```bash
POST http://localhost:8000/api/alunos
Authorization: Bearer {token_aluno}

{
  "id_usuario": 3,
  "matricula": "2025002",
  "nome": "Teste"
}

# Resposta esperada: 403 Forbidden
```

## 👨‍🏫 4. Testes de Professores

### 4.1. Criar Professor (ADMIN)

```bash
POST http://localhost:8000/api/professores
Authorization: Bearer {token_admin}

{
  "id_usuario": 3,  # ID do usuário PROFESSOR
  "nome": "Maria Oliveira Costa",
  "endereco": "Av. Principal, 456",
  "telefone": "(11) 91234-5678",
  "email": "maria.oliveira@escola.com"
}
```

### 4.2. Listar Professores (ADMIN/PROFESSOR)

```bash
GET http://localhost:8000/api/professores?offset=0&limit=10
Authorization: Bearer {token_professor}

# ALUNO não deve conseguir
GET http://localhost:8000/api/professores
Authorization: Bearer {token_aluno}
# Esperado: 403 Forbidden
```

## 📚 5. Testes de Disciplinas

### 5.1. Criar Disciplina (ADMIN)

```bash
POST http://localhost:8000/api/disciplinas
Authorization: Bearer {token_admin}

{
  "nome": "Matemática",
  "serie": "5º",
  "turno": "Manhã"
}
```

### 5.2. Listar Disciplinas (Todos)

```bash
GET http://localhost:8000/api/disciplinas?offset=0&limit=10
Authorization: Bearer {token_aluno}

# Todos os perfis devem conseguir listar
```

## 🏫 6. Testes de Turmas

### 6.1. Criar Turma (ADMIN)

```bash
POST http://localhost:8000/api/turmas
Authorization: Bearer {token_admin}

{
  "nome": "5º A",
  "ano_letivo": 2025,
  "id_professor": 1,
  "id_disciplina": 1
}
```

### 6.2. Listar Turmas com Filtro

```bash
# Todas as turmas
GET http://localhost:8000/api/turmas?offset=0&limit=10
Authorization: Bearer {token_admin}

# Filtrar por ano letivo
GET http://localhost:8000/api/turmas?ano_letivo=2025
Authorization: Bearer {token_admin}
```

### 6.3. Teste de Paginação

```bash
# Primeira página (10 registros)
GET http://localhost:8000/api/turmas?offset=0&limit=10

# Segunda página
GET http://localhost:8000/api/turmas?offset=10&limit=10

# Página maior (50 registros)
GET http://localhost:8000/api/turmas?offset=0&limit=50
```

## 📝 7. Testes de Matrícula (Aluno_Turma)

### 7.1. Matricular Aluno em Turma (ADMIN)

```bash
POST http://localhost:8000/api/aluno-turma
Authorization: Bearer {token_admin}

{
  "id_aluno": 1,
  "id_turma": 1
}
```

### 7.2. Listar Matrículas

```bash
GET http://localhost:8000/api/aluno-turma?offset=0&limit=10
Authorization: Bearer {token_admin}
```

### 7.3. Remover Matrícula (Soft Delete)

```bash
DELETE http://localhost:8000/api/aluno-turma/1
Authorization: Bearer {token_admin}
```

## 📰 8. Testes de Notícias

### 8.1. Criar Notícia (PROFESSOR)

```bash
POST http://localhost:8000/api/noticias
Authorization: Bearer {token_professor}

{
  "titulo": "Início do Ano Letivo 2025",
  "conteudo": "Informamos que as aulas terão início no dia 10 de fevereiro de 2025. Todas as famílias devem comparecer para a reunião inicial no dia 05/02.",
  "data": "2025-01-15"
}
```

### 8.2. Listar Notícias (Todos)

```bash
GET http://localhost:8000/api/noticias?offset=0&limit=10
Authorization: Bearer {token_aluno}

# Todos podem listar notícias
```

### 8.3. Atualizar Notícia (PROFESSOR)

```bash
PUT http://localhost:8000/api/noticias/1
Authorization: Bearer {token_professor}

{
  "titulo": "Início do Ano Letivo 2025 - ATUALIZADO",
  "conteudo": "NOVA DATA: As aulas começam dia 12/02/2025"
}
```

### 8.4. Deletar Notícia (ADMIN/PROFESSOR)

```bash
DELETE http://localhost:8000/api/noticias/1
Authorization: Bearer {token_professor}

# Resposta: 204 No Content
```

### 8.5. Teste de Permissão (ALUNO não pode criar)

```bash
POST http://localhost:8000/api/noticias
Authorization: Bearer {token_aluno}

{
  "titulo": "Teste",
  "conteudo": "Conteúdo teste"
}

# Esperado: 403 Forbidden
```

## 📅 9. Testes de Eventos

### 9.1. Criar Evento (PROFESSOR)

```bash
POST http://localhost:8000/api/eventos
Authorization: Bearer {token_professor}

{
  "titulo": "Festa Junina 2025",
  "conteudo": "Grande festa junina com apresentações dos alunos, comidas típicas e muita diversão!",
  "data": "2025-06-15"
}
```

### 9.2. Listar Eventos (Todos)

```bash
GET http://localhost:8000/api/eventos?offset=0&limit=10
Authorization: Bearer {token_aluno}
```

## 📸 10. Testes de Galeria (Imagens)

### 10.1. Upload de Imagem (Base64)

```bash
POST http://localhost:8000/api/galeria
Authorization: Bearer {token_professor}

{
  "id_evento": 1,
  "descricao": "Foto da festa junina",
  "data": "2025-06-15",
  "imagem_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA..."
}

# Nota: Use uma imagem real em Base64
```

### 10.2. Listar Galeria (Metadados)

```bash
# Todas as imagens
GET http://localhost:8000/api/galeria?offset=0&limit=10
Authorization: Bearer {token_aluno}

# Filtrar por evento
GET http://localhost:8000/api/galeria?id_evento=1
Authorization: Bearer {token_aluno}
```

### 10.3. Baixar Imagem (Base64)

```bash
GET http://localhost:8000/api/galeria/1/image
Authorization: Bearer {token_aluno}

# Resposta: JSON com imagem_base64
{
  "id_imagem": 1,
  "imagem_base64": "iVBORw0KGg...",
  "descricao": "Foto da festa junina"
}
```

### 10.4. Atualizar Imagem

```bash
PUT http://localhost:8000/api/galeria/1
Authorization: Bearer {token_professor}

{
  "descricao": "Foto da festa junina - Atualizada",
  "imagem_base64": "nova_imagem_em_base64..."
}
```

## 📅 11. Testes de Calendário

### 11.1. Criar Evento do Calendário (PROFESSOR)

```bash
POST http://localhost:8000/api/calendario
Authorization: Bearer {token_professor}

{
  "data": "2025-02-10",
  "evento": "Início das Aulas",
  "descricao": "Primeiro dia do ano letivo 2025"
}
```

### 11.2. Listar Calendário (Todos)

```bash
GET http://localhost:8000/api/calendario?offset=0&limit=10
Authorization: Bearer {token_aluno}
```

## 🔄 12. Testes de Integridade

### 12.1. Criar Aluno com Usuário Inexistente

```bash
POST http://localhost:8000/api/alunos
Authorization: Bearer {token_admin}

{
  "id_usuario": 9999,  # ID inexistente
  "matricula": "2025099",
  "nome": "Teste"
}

# Esperado: 404 Not Found - "Usuário não encontrado"
```

### 12.2. Criar Aluno com Matrícula Duplicada

```bash
POST http://localhost:8000/api/alunos
Authorization: Bearer {token_admin}

{
  "id_usuario": 2,
  "matricula": "2025001",  # Matrícula já existente
  "nome": "Outro Aluno"
}

# Esperado: 400 Bad Request - "Já existe um aluno com esta matrícula"
```

### 12.3. Criar Turma com Professor Inexistente

```bash
POST http://localhost:8000/api/turmas
Authorization: Bearer {token_admin}

{
  "nome": "6º A",
  "ano_letivo": 2025,
  "id_professor": 9999,  # ID inexistente
  "id_disciplina": 1
}

# Esperado: Erro de integridade referencial
```

## 📊 13. Testes de Paginação Avançados

### 13.1. Primeira Página

```bash
GET http://localhost:8000/api/alunos?offset=0&limit=5
Authorization: Bearer {token_admin}

# Verificar: total, offset=0, limit=5, items com 5 ou menos
```

### 13.2. Segunda Página

```bash
GET http://localhost:8000/api/alunos?offset=5&limit=5
Authorization: Bearer {token_admin}

# Verificar: total (mesmo valor), offset=5, items diferentes
```

### 13.3. Limite Máximo (100)

```bash
GET http://localhost:8000/api/alunos?offset=0&limit=100
Authorization: Bearer {token_admin}

# Deve funcionar (limite máximo)
```

### 13.4. Limite Inválido (>100)

```bash
GET http://localhost:8000/api/alunos?offset=0&limit=200
Authorization: Bearer {token_admin}

# Esperado: 422 Validation Error
```

### 13.5. Offset Negativo

```bash
GET http://localhost:8000/api/alunos?offset=-1&limit=10
Authorization: Bearer {token_admin}

# Esperado: 422 Validation Error
```

## 🧹 14. Testes de Soft Delete

### 14.1. Verificar Soft Delete

```bash
# 1. Criar aluno
POST http://localhost:8000/api/alunos
{...}
# Retorna ID: 5

# 2. Buscar aluno (deve existir)
GET http://localhost:8000/api/alunos/5
# Status: 200 OK

# 3. Deletar aluno (soft delete)
DELETE http://localhost:8000/api/alunos/5
# Status: 204 No Content

# 4. Tentar buscar novamente (não deve encontrar)
GET http://localhost:8000/api/alunos/5
# Status: 404 Not Found

# 5. Verificar no banco (registro ainda existe com is_deleted=true)
# Use query SQL: SELECT * FROM aluno WHERE id_aluno = 5;
```

## 🎯 Cenários de Teste Completos

### Cenário 1: Fluxo Completo de Matrícula

```bash
# 1. ADMIN cria usuário ALUNO
POST /api/users
{
  "email": "novo.aluno@escola.com",
  "nome_completo": "Novo Aluno",
  "perfil": "ALUNO",
  "senha": "senha123"
}
# Resultado: ID = 10

# 2. ADMIN cria dados do aluno
POST /api/alunos
{
  "id_usuario": 10,
  "matricula": "2025050",
  "nome": "Novo Aluno"
}
# Resultado: id_aluno = 5

# 3. ADMIN matricula aluno em turma
POST /api/aluno-turma
{
  "id_aluno": 5,
  "id_turma": 1
}
# Resultado: Matrícula criada

# 4. ALUNO faz login
POST /api/auth/login
{
  "email": "novo.aluno@escola.com",
  "senha": "senha123"
}
# Resultado: Token do aluno

# 5. ALUNO consulta suas turmas
GET /api/aluno-turma
Authorization: Bearer {token_aluno}
# Resultado: Lista com a turma
```

### Cenário 2: Professor Cria e Gerencia Notícia

```bash
# 1. PROFESSOR faz login
POST /api/auth/login
{
  "email": "professor@escola.com",
  "senha": "prof123"
}

# 2. PROFESSOR cria notícia
POST /api/noticias
Authorization: Bearer {token_prof}
{
  "titulo": "Comunicado Importante",
  "conteudo": "Aulas suspensas amanhã"
}

# 3. PROFESSOR atualiza notícia
PUT /api/noticias/1
Authorization: Bearer {token_prof}
{
  "conteudo": "Aulas suspensas hoje e amanhã"
}

# 4. ALUNO visualiza notícia
GET /api/noticias/1
Authorization: Bearer {token_aluno}
# Resultado: Notícia atualizada

# 5. PROFESSOR deleta notícia
DELETE /api/noticias/1
Authorization: Bearer {token_prof}

# 6. ALUNO tenta visualizar (não encontra)
GET /api/noticias/1
Authorization: Bearer {token_aluno}
# Resultado: 404 Not Found
```

## 📋 Checklist Final

- [ ] Todos os endpoints de criação (POST) funcionam
- [ ] Todos os endpoints de listagem (GET /) retornam paginação
- [ ] Todos os endpoints de busca (GET /{id}) funcionam
- [ ] Todos os endpoints de atualização (PUT) funcionam
- [ ] Todos os endpoints de exclusão (DELETE) fazem soft delete
- [ ] Permissões estão corretas (ADMIN, PROFESSOR, ALUNO)
- [ ] Soft delete funciona em todas as tabelas
- [ ] Validações de dados funcionam
- [ ] Integridade referencial está preservada
- [ ] Erros retornam status codes corretos
- [ ] Autenticação JWT funciona
- [ ] Paginação funciona corretamente
- [ ] Filtros (quando aplicável) funcionam

## 🛠️ Ferramentas Recomendadas

1. **Swagger UI** (http://localhost:8000/docs)
   - Melhor para testes manuais
   - Interface visual
   - Documentação automática

2. **Postman**
   - Criar coleções de testes
   - Variáveis de ambiente
   - Testes automatizados

3. **curl**
   - Testes rápidos via terminal
   - Scripts de automação

4. **pytest**
   - Testes unitários
   - Testes de integração
   - CI/CD

---

**Bons testes! 🧪✅**
