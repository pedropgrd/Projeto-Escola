# Funcionalidade de Edição com Angular Material Dialog

Este documento explica a implementação da funcionalidade de edição (UPDATE) para Alunos e Professores usando Angular Material Dialog.

## 📁 Estrutura de Arquivos

```
src/app/pages/admin/
├── admin.component.ts          # Componente principal (atualizado)
├── admin.component.html        # Template com botões de edição
├── admin.component.scss        # Estilos dos botões
├── edit-aluno-dialog/
│   ├── edit-aluno-dialog.component.ts
│   ├── edit-aluno-dialog.component.html
│   └── edit-aluno-dialog.component.scss
└── edit-professor-dialog/
    ├── edit-professor-dialog.component.ts
    ├── edit-professor-dialog.component.html
    └── edit-professor-dialog.component.scss
```

## 🎯 Funcionalidades Implementadas

### 1. **Componentes de Diálogo**

#### EditAlunoDialogComponent
- Formulário reativo com validações
- Campos: nome, cpf (desabilitado), data de nascimento (MatDatepicker), telefone, endereço
- Conversão automática de datas entre string (YYYY-MM-DD) e Date object
- Matricula exibida mas não editável

#### EditProfessorDialogComponent
- Formulário reativo com validações
- Campos: nome, cpf (desabilitado), email (com validação), telefone, endereço
- Validação de email nativa do Angular

### 2. **Integração com o Backend**

#### Endpoints Utilizados:
- **Alunos**: `PUT /api/v1/alunos/{id}`
- **Professores**: `PUT /api/v1/professores/{id}`

#### Formato dos Dados (JSON):

**Aluno:**
```json
{
  "nome": "João Silva",
  "cpf": "12345678900",
  "data_nascimento": "2005-05-15",
  "endereco": "Rua Exemplo, 123",
  "telefone": "11999887766"
}
```

**Professor:**
```json
{
  "nome": "Maria Santos",
  "cpf": "98765432100",
  "email": "maria@email.com",
  "endereco": "Av. Principal, 456",
  "telefone": "11988776655"
}
```

### 3. **Fluxo de Uso**

1. Usuário clica no botão "Editar" (ícone de lápis) na listagem
2. Dialog abre com dados preenchidos
3. Usuário edita os campos desejados
4. Ao clicar em "Salvar":
   - Validações são executadas
   - Requisição PUT é enviada ao backend
   - Dialog fecha e lista é recarregada
   - Mensagem de sucesso é exibida

## 🔧 Como Usar nos Componentes

### Abrindo o Dialog de Aluno

```typescript
openEditAlunoDialog(aluno: Aluno): void {
  const dialogRef = this.dialog.open(EditAlunoDialogComponent, {
    width: '600px',
    data: {
      id_aluno: aluno.id_aluno,
      matricula: aluno.matricula,
      nome: aluno.nome,
      cpf: aluno.cpf,
      data_nascimento: aluno.data_nascimento,
      endereco: aluno.endereco,
      telefone: aluno.telefone
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result === true) {
      // Sucesso - atualizar lista
      this.loadAlunos();
    }
  });
}
```

### Abrindo o Dialog de Professor

```typescript
openEditProfessorDialog(professor: Professor): void {
  const dialogRef = this.dialog.open(EditProfessorDialogComponent, {
    width: '600px',
    data: {
      id_professor: professor.id_professor,
      nome: professor.nome,
      cpf: professor.cpf,
      email: professor.email,
      endereco: professor.endereco,
      telefone: professor.telefone
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result === true) {
      // Sucesso - atualizar lista
      this.loadProfessores();
    }
  });
}
```

## 🎨 Componentes Angular Material Utilizados

- `MatDialog` - Container do modal
- `MatDialogModule` - Módulo principal
- `MatFormFieldModule` - Campos de formulário
- `MatInputModule` - Inputs
- `MatButtonModule` - Botões
- `MatIconModule` - Ícones
- `MatDatepickerModule` - Seletor de data (apenas Aluno)
- `MatNativeDateModule` - Adaptador de data nativo

## 📝 Validações Implementadas

### Aluno:
- **Nome**: Obrigatório, mínimo 3 caracteres
- **CPF**: Obrigatório (desabilitado para edição)
- **Data de Nascimento**: Obrigatória
- **Telefone**: Obrigatório, mínimo 10 caracteres
- **Endereço**: Obrigatório

### Professor:
- **Nome**: Obrigatório, mínimo 3 caracteres
- **CPF**: Obrigatório (desabilitado para edição)
- **Email**: Obrigatório, formato de email válido
- **Telefone**: Obrigatório, mínimo 10 caracteres
- **Endereço**: Obrigatório

## 🎯 Tratamento de Erros

- Validações do formulário em tempo real
- Mensagens de erro personalizadas por campo
- Tratamento de erros da API:
  - Exibição de mensagens de erro
  - Loading states durante requisições
  - Feedback visual ao usuário

## 🚀 Melhorias Futuras

1. **Máscaras de Input**
   - Implementar máscaras para CPF e telefone
   - Biblioteca sugerida: `ngx-mask`

2. **Validação de CPF**
   - Adicionar validação de dígitos verificadores

3. **Upload de Foto**
   - Adicionar campo para foto do aluno/professor

4. **Histórico de Alterações**
   - Registrar quem e quando editou

5. **Confirmação de Saída**
   - Avisar sobre dados não salvos ao fechar

## 📚 Referências

- [Angular Material Dialog](https://material.angular.io/components/dialog/overview)
- [Reactive Forms](https://angular.io/guide/reactive-forms)
- [Angular Material Datepicker](https://material.angular.io/components/datepicker/overview)

---

**Desenvolvido para o Sistema de Gestão Escolar** 🎓
