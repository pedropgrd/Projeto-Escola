import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

/**
 * Guard de Autenticação Funcional
 * 
 * Verifica:
 * 1. Se o usuário está autenticado
 * 2. Se o usuário tem o perfil necessário para acessar a rota
 * 
 * Uso nas rotas:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [authGuard],
 *   data: { roles: [UserRole.ADMIN] }
 * }
 * ```
 */
export const authGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Verificar se está autenticado
    if (!authService.isAuthenticatedSync()) {
        console.warn('Usuário não autenticado - redirecionando para login');
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    // 2. Verificar perfil/role (se especificado na rota)
    const requiredRoles = route.data['roles'] as UserRole[] | undefined;

    if (requiredRoles && requiredRoles.length > 0) {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            console.error('Usuário não encontrado');
            router.navigate(['/login']);
            return false;
        }

        // ADMIN tem acesso a tudo
        if (currentUser.perfil === UserRole.ADMIN) {
            return true;
        }

        // Verificar se o usuário tem algum dos perfis necessários
        if (!requiredRoles.includes(currentUser.perfil)) {
            console.error(`Acesso negado - perfil ${currentUser.perfil} não autorizado`);
            console.error(`Perfis necessários: ${requiredRoles.join(', ')}`);

            router.navigate(['/'], {
                queryParams: { error: 'access_denied' }
            });
            return false;
        }
    }

    return true;
};

/**
 * Guard para rotas públicas (apenas usuários NÃO autenticados)
 * 
 * Útil para páginas de login - redireciona se já estiver autenticado
 * 
 * Uso nas rotas:
 * ```typescript
 * {
 *   path: 'login',
 *   canActivate: [publicGuard]
 * }
 * ```
 */
export const publicGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Se já estiver autenticado, redirecionar para home
    if (authService.isAuthenticatedSync()) {
        const returnUrl = route.queryParams['returnUrl'] || '/';
        router.navigate([returnUrl]);
        return false;
    }

    return true;
};

/**
 * Guard específico para ADMIN
 * 
 * Uso nas rotas:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [adminGuard]
 * }
 * ```
 */
export const adminGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticatedSync()) {
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    if (!authService.hasRole(UserRole.ADMIN)) {
        console.error('Acesso negado - apenas ADMIN');
        router.navigate(['/'], {
            queryParams: { error: 'admin_only' }
        });
        return false;
    }

    return true;
};

/**
 * Guard específico para PROFESSOR
 * 
 * ADMIN também tem acesso (ADMIN pode tudo)
 */
export const professorGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticatedSync()) {
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    const hasAccess = authService.hasAnyRole([UserRole.ADMIN, UserRole.PROFESSOR]);

    if (!hasAccess) {
        console.error('Acesso negado - apenas ADMIN e PROFESSOR');
        router.navigate(['/'], {
            queryParams: { error: 'professor_only' }
        });
        return false;
    }

    return true;
};

/**
 * Guard específico para ALUNO
 * 
 * ADMIN também tem acesso (ADMIN pode tudo)
 */
export const alunoGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticatedSync()) {
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    const hasAccess = authService.hasAnyRole([UserRole.ADMIN, UserRole.ALUNO]);

    if (!hasAccess) {
        console.error('Acesso negado - apenas ADMIN e ALUNO');
        router.navigate(['/'], {
            queryParams: { error: 'aluno_only' }
        });
        return false;
    }

    return true;
};

