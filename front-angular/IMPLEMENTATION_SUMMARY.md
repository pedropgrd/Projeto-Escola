# 🔐 Camada de Segurança e Serviços - Implementação Completa

## ✅ O que foi implementado

### 1. **ApiService** - Serviço HTTP Genérico
📁 `src/app/core/services/api.service.ts`

✨ **Funcionalidades:**
- Métodos tipados com Generics (`get<T>`, `post<T>`, `put<T>`, `delete<T>`)
- Tratamento global de erros
- Upload de arquivos com `FormData`
- URL base configurável via `environment.ts`

```typescript
// Exemplo de uso
apiService.get<User[]>('/users')
apiService.post<User>('/users', userData)
apiService.delete<void>(`/users/${id}`)
```

---

### 2. **AuthService** - Gerenciamento de Autenticação
📁 `src/app/core/services/auth.service.ts`

✨ **Funcionalidades:**
- Login/Logout completo
- Decodificação automática de JWT
- Armazenamento seguro de tokens
- **BehaviorSubject** para compatibilidade com Observables
- **Signals** para abordagem moderna (Angular 16+)
- Verificação de expiração de token
- Helpers de perfil (`hasRole`, `hasAnyRole`)

```typescript
// Signals (recomendado)
authService.isAuthenticated()  // computed signal
authService.isAdmin()          // computed signal
authService.user()             // readonly signal

// Observable (alternativa)
authService.currentUser$.subscribe(user => ...)
```

---

### 3. **AuthInterceptor** - Injeção Automática de Token
📁 `src/app/core/interceptors/auth.interceptor.ts`

✨ **Funcionalidades:**
- Injeta automaticamente `Authorization: Bearer {token}`
- Exclui endpoints públicos (login, signup)
- Intercepta erro 401 → Logout automático
- Intercepta erro 403 → Redireciona com mensagem

**Configuração:** Já está registrado no `app.config.ts`

---

### 4. **Guards Funcionais** - Controle de Acesso
📁 `src/app/core/guards/auth.guard.ts`

✨ **Guards disponíveis:**
- `authGuard` - Verifica autenticação básica + roles opcionais
- `publicGuard` - Só acessa se NÃO autenticado (para login)
- `adminGuard` - Apenas ADMIN
- `professorGuard` - ADMIN + PROFESSOR
- `alunoGuard` - ADMIN + ALUNO

```typescript
// Exemplo de uso nas rotas
{
  path: 'admin',
  canActivate: [adminGuard]
}

{
  path: 'turmas',
  canActivate: [authGuard],
  data: { roles: [UserRole.ADMIN, UserRole.PROFESSOR] }
}
```

---

### 5. **Models e Types** - Tipagem Forte
📁 `src/app/core/models/auth.models.ts`

✨ **Interfaces definidas:**
- `UserRole` (enum)
- `TokenPayload` (payload do JWT)
- `UserData` (dados do usuário)
- `LoginCredentials` (credenciais de login)
- `LoginResponse` (resposta da API)
- `ApiError` (erro padronizado)

---

### 6. **Environment Configuration**
📁 `src/environments/`

✨ **Configurações:**
- `apiUrl` - URL base da API
- `tokenKey` - Chave do token no localStorage
- `refreshTokenKey` - Chave do refresh token
- `userKey` - Chave dos dados do usuário

---

## 🚀 Como Usar

### 1️⃣ Atualizar `app.config.ts`

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

### 2️⃣ Configurar Rotas (app.routes.ts)

Veja o arquivo de exemplo: `app.routes.example.ts`

```typescript
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin.component')
      .then(m => m.AdminComponent)
  }
];
```

---

### 3️⃣ Componentes já atualizados

✅ **LoginComponent** - Implementado com novos services
✅ **HeaderComponent** - Menu condicional por perfil

---

## 📖 Documentação Completa

Consulte: **`SECURITY_GUIDE.md`**

Contém:
- ✅ Exemplos de uso detalhados
- ✅ Fluxos de autenticação
- ✅ Matriz de permissões
- ✅ Troubleshooting
- ✅ Boas práticas

---

## 🎯 Estrutura Final

```
src/app/core/
├── models/
│   └── auth.models.ts          ✅ Tipos e interfaces
├── services/
│   ├── api.service.ts          ✅ HTTP genérico
│   └── auth.service.ts         ✅ Autenticação
├── interceptors/
│   └── auth.interceptor.ts     ✅ Injeção de token
└── guards/
    └── auth.guard.ts           ✅ Controle de acesso
```

---

## 🔑 Fluxo de Autenticação

```
1. Usuário faz login → AuthService.login()
2. API retorna { access_token, refresh_token }
3. AuthService decodifica JWT e extrai dados do usuário
4. Dados salvos no localStorage + BehaviorSubject + Signal
5. Interceptor injeta token em todas as requisições
6. Guards protegem rotas baseadas em perfil
7. Se 401 → Logout automático
```

---

## 🛡️ Controle de Acesso (RBAC)

### Matriz de Permissões

| Perfil     | Acesso Admin | Acesso Professor | Acesso Aluno |
|------------|--------------|------------------|--------------|
| ADMIN      | ✅            | ✅                | ✅            |
| PROFESSOR  | ❌            | ✅                | ❌            |
| ALUNO      | ❌            | ❌                | ✅            |

### Regra de Ouro
**ADMIN tem acesso a TUDO** 🔑

---

## 🧪 Testando

### 1. Iniciar Backend
```bash
cd back_python
uvicorn app.main:app --reload
```

### 2. Iniciar Frontend
```bash
cd front-angular
npm start
```

### 3. Testar Login
- Acesse http://localhost:4200/login
- Use credenciais válidas do backend
- Verifique token no console:
```javascript
localStorage.getItem('auth_token')
```

### 4. Testar Guards
- Tente acessar `/admin` sem estar logado → Redirect para `/login`
- Logue como PROFESSOR e tente `/admin` → Redirect com erro

---

## 📦 Dependências Necessárias

Já incluídas no Angular:
- ✅ `@angular/common/http`
- ✅ `@angular/router`
- ✅ `rxjs`

---

## 🎓 Próximos Passos Sugeridos

1. **Implementar refresh token automático** quando o access_token expirar
2. **Criar página de perfil do usuário**
3. **Implementar recuperação de senha**
4. **Adicionar testes unitários** para services e guards
5. **Implementar Remember Me** (refresh token de longa duração)

---

## 💡 Dicas Importantes

### ✅ DO's
- Use Signals para estados reativos
- Implemente lazy loading nas rotas
- Sempre verifique perfil no backend também
- Use guards específicos quando possível

### ❌ DON'Ts
- Não confie apenas em guards (backend DEVE validar)
- Não armazene senhas no frontend
- Não manipule tokens manualmente
- Não ignore erros 401/403

---

## 📞 Suporte

Documentação adicional:
- `SECURITY_GUIDE.md` - Guia completo de segurança
- `app.routes.example.ts` - Exemplo de rotas protegidas

---

## ✨ Conclusão

Sistema de autenticação **moderno, escalável e seguro** implementado com:
- ✅ TypeScript + Tipagem forte
- ✅ Angular Signals (moderno)
- ✅ Guards funcionais
- ✅ Interceptors automáticos
- ✅ RBAC completo (3 perfis)
- ✅ JWT decodificado automaticamente
- ✅ Tratamento de erros global

**Pronto para produção!** 🚀

---

**Desenvolvido com ❤️ para o Projeto Escola**
