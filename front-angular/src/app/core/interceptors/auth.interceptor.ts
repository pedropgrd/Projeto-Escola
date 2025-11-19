import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor para Autenticação
 * 
 * Funcionalidades:
 * 1. Injeta automaticamente o token JWT em todas as requisições
 * 2. Exclui rotas públicas (login, refresh, etc.)
 * 3. Intercepta erros 401 (não autorizado) e faz logout automático
 * 4. Intercepta erros 403 (sem permissão) e redireciona
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Lista de endpoints que não precisam de autenticação
    const publicEndpoints = [
        '/auth/login',
        '/auth/signup',
        '/auth/refresh',
        '/auth/forgot-password',
        '/auth/reset-password'
    ];

    // Verifica se é um endpoint público
    const isPublicEndpoint = publicEndpoints.some(endpoint =>
        req.url.includes(endpoint)
    );

    // Se for público, não adicionar token
    if (isPublicEndpoint) {
        return next(req);
    }

    // Obter token
    const token = authService.getToken();

    // Se existir token, clonar requisição e adicionar header Authorization
    let clonedRequest = req;
    if (token) {
        clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    // Processar requisição e tratar erros
    return next(clonedRequest).pipe(
        catchError((error: HttpErrorResponse) => {
            // 401 - Não autorizado (token inválido/expirado)
            if (error.status === 401) {
                console.warn('Token inválido ou expirado - fazendo logout');
                authService.logout();
                router.navigate(['/login'], {
                    queryParams: { returnUrl: router.url, reason: 'session_expired' }
                });
            }

            // 403 - Sem permissão (usuário autenticado mas sem acesso)
            if (error.status === 403) {
                console.error('Acesso negado - sem permissão');
                router.navigate(['/'], {
                    queryParams: { error: 'access_denied' }
                });
            }

            // Repassar o erro
            return throwError(() => error);
        })
    );
};

