# Shared Module

Módulo compartilhado que exporta todos os módulos e componentes mais utilizados no projeto.

## 📦 Conteúdo

### **Angular Material Modules**
- Buttons, Cards, Forms
- Tables, Pagination, Sort
- Dialogs, Snackbars
- Toolbars, Sidenavs, Lists
- Date Picker, Select, Autocomplete
- Tabs, Expansion Panels
- Chips, Badges, Tooltips
- Progress Spinner/Bar

### **Components**
- **LoadingComponent** - Spinner de carregamento
- **ConfirmDialogComponent** - Dialog de confirmação

### **Pipes**
- **CpfPipe** - Formata CPF (XXX.XXX.XXX-XX)
- **PhonePipe** - Formata telefone ((XX) XXXXX-XXXX)

### **Directives**
- **CpfMaskDirective** - Máscara de CPF em inputs
- **PhoneMaskDirective** - Máscara de telefone em inputs

### **Validators**
- **cpf()** - Valida CPF brasileiro
- **phone()** - Valida telefone brasileiro
- **strongPassword()** - Valida senha forte
- **matchFields()** - Valida igualdade de campos

## 🚀 Como usar

### Importar o módulo (para módulos tradicionais):
```typescript
import { SharedModule } from '@app/shared';

@NgModule({
  imports: [SharedModule]
})
```

### Usar componentes standalone:
```typescript
import { LoadingComponent } from '@app/shared/components/loading/loading.component';
import { CpfPipe } from '@app/shared/pipes/cpf.pipe';

@Component({
  standalone: true,
  imports: [LoadingComponent, CpfPipe]
})
```

### Usar validators:
```typescript
import { CustomValidators } from '@app/shared/validators/custom-validators';

this.form = this.fb.group({
  cpf: ['', [Validators.required, CustomValidators.cpf()]],
  senha: ['', [Validators.required, CustomValidators.strongPassword()]]
});
```

### Usar directives:
```html
<input matInput appCpfMask [(ngModel)]="cpf">
<input matInput appPhoneMask [(ngModel)]="telefone">
```

### Usar pipes:
```html
<p>{{ cpf | cpf }}</p>
<p>{{ telefone | phone }}</p>
```
