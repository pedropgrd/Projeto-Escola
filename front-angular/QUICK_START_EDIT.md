# 🚀 Guia Rápido - Edição com Dialog

## ✅ O que foi implementado

### 1. Componentes de Diálogo
- ✅ `EditAlunoDialogComponent` - Modal de edição de alunos
- ✅ `EditProfessorDialogComponent` - Modal de edição de professores

### 2. Recursos
- ✅ Formulários reativos (ReactiveFormsModule)
- ✅ Validações em tempo real
- ✅ Conversão automática de datas
- ✅ Ícones do Material Design
- ✅ Feedback visual (loading, erros, sucesso)
- ✅ Design responsivo

### 3. Integração
- ✅ Método PUT no ApiService
- ✅ Botões de edição nas tabelas
- ✅ Atualização automática da lista após salvar

## 🎯 Como Testar

### Passo 1: Iniciar o servidor
```bash
cd front-angular
npm start
```

### Passo 2: Acessar o painel admin
```
http://localhost:4200/admin
```

### Passo 3: Testar edição de aluno
1. Localize um aluno na tabela
2. Clique no botão amarelo com ícone de lápis (edit)
3. Edite os campos desejados
4. Clique em "Salvar"
5. Verifique a mensagem de sucesso

### Passo 4: Testar edição de professor
1. Alterne para a aba "Professores"
2. Localize um professor na tabela
3. Clique no botão amarelo com ícone de lápis (edit)
4. Edite os campos desejados
5. Clique em "Salvar"
6. Verifique a mensagem de sucesso

## 🔍 Campos Editáveis

### Aluno
- ✅ Nome
- ❌ CPF (desabilitado)
- ❌ Matrícula (apenas visualização)
- ✅ Data de Nascimento (com seletor de data)
- ✅ Telefone
- ✅ Endereço

### Professor
- ✅ Nome
- ❌ CPF (desabilitado)
- ✅ Email (com validação)
- ✅ Telefone
- ✅ Endereço

## 🎨 Visual

### Botões na Tabela
- 🟡 **Botão Amarelo (Edit)** - Abre o modal de edição
- 🔴 **Botão Vermelho (Delete)** - Exclui o registro

### Modal
- 📝 **Título** - "Editar Aluno" ou "Editar Professor"
- 🔽 **Campos** - Formulário com validações
- ❌ **Cancelar** - Fecha sem salvar
- ✅ **Salvar** - Envia para o backend

## 🐛 Troubleshooting

### Erro: "Could not find MatDialog provider"
**Solução**: O MatDialogModule já está importado no AdminComponent

### Erro: "Date not formatting correctly"
**Solução**: A conversão de data está implementada no componente

### Erro: "PUT request failed"
**Solução**: Verifique se:
- O backend está rodando
- O token de autenticação está válido
- O ID do aluno/professor existe

## 📦 Dependências Necessárias

Todas já instaladas:
```json
{
  "@angular/material": "^18.2.14",
  "@angular/cdk": "^18.2.14",
  "@angular/animations": "^18.2.0"
}
```

## 🔗 Endpoints da API

```typescript
// Alunos
PUT /api/v1/alunos/{id}

// Professores
PUT /api/v1/professores/{id}
```

## 💡 Dicas

1. **CPF não pode ser editado** - Isso é intencional por segurança
2. **Data de nascimento** - Use o seletor de calendário
3. **Email** - Validação automática de formato
4. **Telefone** - Aceita qualquer formato (mínimo 10 caracteres)

## ✨ Próximos Passos

Se quiser adicionar máscaras de input:
```bash
npm install ngx-mask
```

Depois importe no componente:
```typescript
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
```

---

**Tudo pronto para usar! 🎉**
