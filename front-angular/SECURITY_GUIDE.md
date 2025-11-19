# 🔐 Sistema de Autenticação e Segurança - Guia Completo

## 📋 Visão Geral

Este sistema implementa autenticação JWT completa com controle de acesso baseado em perfis (RBAC) para o frontend Angular.

### ✨ Funcionalidades

- ✅ Login/Logout com JWT
- ✅ Armazenamento seguro de tokens
- ✅ Decodificação automática de JWT
- ✅ Interceptor automático para injeção de token
- ✅ Guards funcionais para controle de acesso
- ✅ Suporte a BehaviorSubject + Signals (Angular moderno)
- ✅ Tratamento de erros 401/403
- ✅ Logout automático em caso de token expirado
- ✅ Tipagem forte com TypeScript

---

## 🏗️ Arquitetura

```
core/
├── models/
│   └── auth.models.ts         # Interfaces e Enums
├── services/
│   ├── api.service.ts         # Serviço HTTP genérico
│   └── auth.service.ts        # Serviço de autenticação
├── interceptors/
│   └── auth.interceptor.ts    # Interceptor JWT
└── guards/
    └── auth.guard.ts          # Guards de rota
```

---

## 🚀 Como Usar

### 1️⃣ Configuração no `app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

---

### 2️⃣ Login Component

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginCredentials } from '../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  errorMessage = '';
  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginCredentials = this.loginForm.value as LoginCredentials;

    this.authService.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.errorMessage = error.detail || 'Erro ao fazer login';
        this.isLoading = false;
      }
    });
  }
}
```

---

### 3️⃣ Configuração de Rotas com Guards

```typescript
import { Routes } from '@angular/router';
import { 
  authGuard, 
  publicGuard, 
  adminGuard, 
  professorGuard 
} from './core/guards/auth.guard';
import { UserRole } from './core/models/auth.models';

export const routes: Routes = [
  // Rota pública (apenas não autenticados)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component')
      .then(m => m.LoginComponent),
    canActivate: [publicGuard]
  },

  // Rota protegida básica (qualquer usuário autenticado)
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component')
      .then(m => m.HomeComponent),
    canActivate: [authGuard]
  },

  // Rota exclusiva para ADMIN
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component')
      .then(m => m.AdminComponent),
    canActivate: [adminGuard]
  },

  // Rota para ADMIN e PROFESSOR
  {
    path: 'professores',
    loadComponent: () => import('./pages/professores/professores.component')
      .then(m => m.ProfessoresComponent),
    canActivate: [professorGuard]
  },

  // Rota com roles específicos (ADMIN tem acesso a tudo)
  {
    path: 'turmas',
    loadComponent: () => import('./pages/turmas/turmas.component')
      .then(m => m.TurmasComponent),
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PROFESSOR] }
  },

  // Wildcard
  {
    path: '**',
    redirectTo: ''
  }
];
```

---

### 4️⃣ Uso no Template (Signals)

```html
<!-- header.component.html -->
<nav>
  @if (authService.isAuthenticated()) {
    <div class="user-info">
      <span>Olá, {{ authService.user()?.nomeCompleto }}</span>
      
      <!-- Mostrar menu apenas para ADMIN -->
      @if (authService.isAdmin()) {
        <a routerLink="/admin">Painel Admin</a>
      }
      
      <!-- Mostrar menu para PROFESSOR e ADMIN -->
      @if (authService.isProfessor() || authService.isAdmin()) {
        <a routerLink="/professores">Professores</a>
      }
      
      <button (click)="logout()">Sair</button>
    </div>
  } @else {
    <a routerLink="/login">Entrar</a>
  }
</nav>
```

```typescript
// header.component.ts
import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
```

---

### 5️⃣ Uso com Observables (Alternativa)

```typescript
import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (currentUser$ | async; as user) {
      <div>
        <h2>{{ user.nomeCompleto }}</h2>
        <p>Email: {{ user.email }}</p>
        <p>Perfil: {{ user.perfil }}</p>
      </div>
    }
  `
})
export class ProfileComponent {
  private authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;
}
```

---

### 6️⃣ Consumindo a API (Exemplo)

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

interface Aluno {
  id: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
}

@Component({
  selector: 'app-alunos',
  standalone: true,
  templateUrl: './alunos.component.html'
})
export class AlunosComponent implements OnInit {
  private apiService = inject(ApiService);
  
  alunos: Aluno[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadAlunos();
  }

  loadAlunos(): void {
    this.isLoading = true;
    
    // O token JWT é injetado automaticamente pelo interceptor
    this.apiService.get<Aluno[]>('/alunos').subscribe({
      next: (data) => {
        this.alunos = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.detail;
        this.isLoading = false;
      }
    });
  }

  deleteAluno(id: number): void {
    this.apiService.delete<void>(`/alunos/${id}`).subscribe({
      next: () => {
        this.alunos = this.alunos.filter(a => a.id !== id);
      },
      error: (error) => {
        console.error('Erro ao deletar:', error);
      }
    });
  }
}
```

---

## 🎯 Controle de Acesso (RBAC)

### Matriz de Permissões

| Perfil     | Acesso Admin | Acesso Professor | Acesso Aluno |
|------------|--------------|------------------|--------------|
| ADMIN      | ✅            | ✅                | ✅            |
| PROFESSOR  | ❌            | ✅                | ❌            |
| ALUNO      | ❌            | ❌                | ✅            |

### Regras

- **ADMIN** tem acesso total ao sistema
- **PROFESSOR** acessa rotas de professor + suas próprias rotas
- **ALUNO** acessa apenas rotas de aluno

---

## 🔑 Estrutura do JWT

O token é decodificado automaticamente e contém:

```json
{
  "sub": "123",              // ID do usuário
  "email": "user@example.com",
  "nome": "João Silva",
  "perfil": "PROFESSOR",     // ADMIN | PROFESSOR | ALUNO
  "iat": 1700000000,         // Timestamp de criação
  "exp": 1700003600,         // Timestamp de expiração
  "type": "access"           // Tipo do token
}
```

---

## 🛡️ Segurança

### Armazenamento de Tokens

- Tokens salvos no `localStorage`
- Keys configuráveis no `environment.ts`
- Verificação automática de expiração

### Interceptor de Erros

- **401 Unauthorized**: Logout automático + redirect para login
- **403 Forbidden**: Redirect para home com mensagem de erro
- Tratamento global de erros HTTP

### Validações

- Token expirado → Logout automático
- Token inválido → Logout automático
- Perfil inválido → Reject na decodificação

---

## 📝 Boas Práticas

### ✅ DO's

- Use Signals para estados reativo moderno
- Implemente lazy loading nas rotas
- Use guards específicos (adminGuard, professorGuard)
- Mantenha o estado do usuário sincronizado
- Implemente refresh token se necessário

### ❌ DON'Ts

- Não armazene senhas no frontend
- Não confie apenas em guards (backend deve validar)
- Não manipule tokens manualmente (use o service)
- Não ignore erros de autenticação

---

## 🧪 Testando

### Fluxo de Teste Manual

1. **Login**
   - Acesse `/login`
   - Entre com credenciais válidas
   - Verifique redirect para home

2. **Token no Console**
   ```javascript
   // No console do navegador
   localStorage.getItem('auth_token')
   ```

3. **Verificar Payload**
   ```javascript
   // Decodificar token
   const token = localStorage.getItem('auth_token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log(payload);
   ```

4. **Testar Guards**
   - Acesse rota protegida sem login → Redirect para `/login`
   - Acesse rota ADMIN como PROFESSOR → Redirect com erro

---

## 🔧 Troubleshooting

### Problema: Token não está sendo enviado

**Solução**: Verifique se o interceptor está registrado no `app.config.ts`

### Problema: 401 após login

**Solução**: 
- Verifique se a URL da API está correta no `environment.ts`
- Confirme que o backend está retornando `access_token` e `refresh_token`

### Problema: Guards não funcionando

**Solução**: 
- Verifique se a rota está usando `canActivate: [authGuard]`
- Confirme que o perfil do usuário está correto no token

---

## 📚 Próximos Passos

- [ ] Implementar refresh token automático
- [ ] Adicionar rate limiting no frontend
- [ ] Implementar remember me
- [ ] Adicionar autenticação social (Google, etc.)
- [ ] Implementar 2FA (Two-Factor Authentication)

---

## 🎓 Recursos Adicionais

- [Angular Guards](https://angular.dev/guide/routing/common-router-tasks#preventing-unauthorized-access)
- [HTTP Interceptors](https://angular.dev/guide/http/interceptors)
- [JWT.io](https://jwt.io/) - Decodificador de JWT
- [Angular Signals](https://angular.dev/guide/signals)

---

**Desenvolvido com ❤️ usando Angular + FastAPI**
