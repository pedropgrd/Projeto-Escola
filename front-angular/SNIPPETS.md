# 🎯 Snippets e Receitas Úteis

## 📋 Índice
1. [Verificações de Permissão](#verificações-de-permissão)
2. [Formulários Reativos](#formulários-reativos)
3. [Tratamento de Erros](#tratamento-de-erros)
4. [Guards Customizados](#guards-customizados)
5. [Redirecionamento Inteligente](#redirecionamento-inteligente)

---

## 1. Verificações de Permissão

### No Template (Signals)

```html
<!-- Mostrar apenas para ADMIN -->
@if (authService.isAdmin()) {
  <button>Deletar</button>
}

<!-- Mostrar para ADMIN ou PROFESSOR -->
@if (authService.isAdmin() || authService.isProfessor()) {
  <a routerLink="/turmas">Turmas</a>
}

<!-- Mostrar nome do usuário -->
<span>{{ authService.user()?.nomeCompleto }}</span>

<!-- Verificar se está autenticado -->
@if (authService.isAuthenticated()) {
  <div>Bem-vindo!</div>
} @else {
  <a routerLink="/login">Fazer login</a>
}
```

### No Componente (TypeScript)

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { UserRole } from '../core/models/auth.models';

@Component({...})
export class MyComponent {
  private authService = inject(AuthService);

  canEdit(): boolean {
    // Apenas ADMIN pode editar
    return this.authService.hasRole(UserRole.ADMIN);
  }

  canView(): boolean {
    // ADMIN ou PROFESSOR podem visualizar
    return this.authService.hasAnyRole([
      UserRole.ADMIN, 
      UserRole.PROFESSOR
    ]);
  }

  getUserName(): string {
    return this.authService.user()?.nomeCompleto || 'Visitante';
  }

  getUserEmail(): string | undefined {
    const user = this.authService.getCurrentUser();
    return user?.email;
  }
}
```

---

## 2. Formulários Reativos

### Login com Validação

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login-reactive',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <div>
        <input formControlName="email" placeholder="E-mail">
        @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
          <span class="error">E-mail inválido</span>
        }
      </div>
      
      <div>
        <input formControlName="senha" type="password" placeholder="Senha">
        @if (loginForm.get('senha')?.invalid && loginForm.get('senha')?.touched) {
          <span class="error">Senha deve ter no mínimo 6 caracteres</span>
        }
      </div>
      
      <button [disabled]="loginForm.invalid || isLoading()">
        {{ isLoading() ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  `
})
export class LoginReactiveComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    const credentials = this.loginForm.value as LoginCredentials;

    this.authService.login(credentials).subscribe({
      next: () => {
        // Sucesso
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
```

---

## 3. Tratamento de Erros

### Service com Error Handler

```typescript
import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { catchError, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProfessorService {
  private apiService = inject(ApiService);
  
  errorMessage = signal('');
  successMessage = signal('');

  getProfessores() {
    return this.apiService.get<Professor[]>('/professores').pipe(
      tap(() => this.clearMessages()),
      catchError(error => {
        this.errorMessage.set(this.getErrorMessage(error));
        return of([]); // Retorna array vazio em caso de erro
      })
    );
  }

  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Sessão expirada. Faça login novamente.';
    }
    if (error.status === 403) {
      return 'Você não tem permissão para esta ação.';
    }
    if (error.status === 404) {
      return 'Recurso não encontrado.';
    }
    if (error.status === 0) {
      return 'Não foi possível conectar ao servidor.';
    }
    return error.detail || 'Ocorreu um erro. Tente novamente.';
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
```

### Componente com Toast/Notificação

```typescript
import { Component, inject, signal } from '@angular/core';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-with-toast',
  template: `
    @if (toast()) {
      <div class="toast" [ngClass]="'toast-' + toast()!.type">
        {{ toast()!.message }}
      </div>
    }
  `
})
export class ComponentWithToast {
  private apiService = inject(ApiService);
  
  toast = signal<Toast | null>(null);

  showToast(message: string, type: Toast['type'] = 'info'): void {
    this.toast.set({ message, type });
    
    // Auto-hide após 3 segundos
    setTimeout(() => this.toast.set(null), 3000);
  }

  saveData(): void {
    this.apiService.post('/data', {}).subscribe({
      next: () => {
        this.showToast('Dados salvos com sucesso!', 'success');
      },
      error: (error) => {
        this.showToast(error.detail || 'Erro ao salvar', 'error');
      }
    });
  }
}
```

---

## 4. Guards Customizados

### Guard com Redirecionamento por Perfil

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

/**
 * Redireciona usuário para sua página específica baseado no perfil
 */
export const roleBasedRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // Redirecionar baseado no perfil
  switch (user.perfil) {
    case UserRole.ADMIN:
      router.navigate(['/admin/dashboard']);
      break;
    case UserRole.PROFESSOR:
      router.navigate(['/professor/turmas']);
      break;
    case UserRole.ALUNO:
      router.navigate(['/aluno/materias']);
      break;
  }

  return false; // Sempre redireciona
};
```

### Guard com Verificação de Recurso

```typescript
/**
 * Verifica se o usuário pode acessar um recurso específico
 */
export const resourceOwnerGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  const resourceOwnerId = route.params['userId'];

  // ADMIN pode acessar qualquer recurso
  if (authService.isAdmin()) {
    return true;
  }

  // Usuário só pode acessar seus próprios recursos
  if (user?.id.toString() === resourceOwnerId) {
    return true;
  }

  router.navigate(['/nao-autorizado']);
  return false;
};

// Uso:
// {
//   path: 'perfil/:userId',
//   canActivate: [resourceOwnerGuard]
// }
```

---

## 5. Redirecionamento Inteligente

### Salvar e Restaurar URL de Retorno

```typescript
// auth.service.ts
export class AuthService {
  private returnUrlKey = 'return_url';

  setReturnUrl(url: string): void {
    sessionStorage.setItem(this.returnUrlKey, url);
  }

  getReturnUrl(): string {
    const url = sessionStorage.getItem(this.returnUrlKey);
    sessionStorage.removeItem(this.returnUrlKey);
    return url || '/';
  }
}

// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticatedSync()) {
    // Salvar URL que o usuário tentou acessar
    authService.setReturnUrl(state.url);
    router.navigate(['/login']);
    return false;
  }

  return true;
};

// login.component.ts
export class LoginComponent {
  onLoginSuccess(): void {
    const returnUrl = this.authService.getReturnUrl();
    this.router.navigate([returnUrl]);
  }
}
```

### Redirecionamento Baseado em Query Params

```typescript
export class LoginComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  onLoginSuccess(): void {
    // Ler returnUrl dos query params
    this.route.queryParams.subscribe(params => {
      const returnUrl = params['returnUrl'] || '/';
      const reason = params['reason']; // Ex: 'session_expired'

      if (reason === 'session_expired') {
        console.log('Sessão expirada - novo login realizado');
      }

      this.router.navigate([returnUrl]);
    });
  }
}
```

---

## 6. Utilitários

### Decorator para Requisitar Autenticação

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Decorator que verifica autenticação antes de executar método
 */
export function RequireAuth() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const authService = inject(AuthService);
      const router = inject(Router);

      if (!authService.isAuthenticatedSync()) {
        router.navigate(['/login']);
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Uso:
export class MyComponent {
  @RequireAuth()
  deleteItem(id: number): void {
    // Só executa se estiver autenticado
    console.log('Deletando item:', id);
  }
}
```

### Helper para Decode JWT Manual

```typescript
/**
 * Decodifica JWT e retorna payload
 */
export function decodeJWT<T = any>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded as T;
  } catch {
    return null;
  }
}

/**
 * Verifica se JWT está expirado
 */
export function isJWTExpired(token: string): boolean {
  const payload = decodeJWT<{ exp: number }>(token);
  if (!payload?.exp) return true;
  
  const exp = payload.exp * 1000; // Converter para ms
  return Date.now() >= exp;
}

// Uso:
const token = 'eyJhbGc...';
const payload = decodeJWT<TokenPayload>(token);
console.log(payload?.email);

if (isJWTExpired(token)) {
  console.log('Token expirado!');
}
```

---

## 7. Padrões Avançados

### Service com Cache

```typescript
@Injectable({ providedIn: 'root' })
export class CachedProfessorService {
  private apiService = inject(ApiService);
  
  private cache = new Map<string, any>();
  private cacheDuration = 5 * 60 * 1000; // 5 minutos

  getProfessores(): Observable<Professor[]> {
    const cacheKey = 'professores_list';
    const cached = this.getFromCache<Professor[]>(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.apiService.get<Professor[]>('/professores').pipe(
      tap(data => this.setCache(cacheKey, data))
    );
  }

  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > this.cacheDuration;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

---

**Fim dos Snippets** 🎯

Use estes exemplos como referência para implementar funcionalidades comuns no seu projeto!
