import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import {
    LoginCredentials,
    LoginResponse,
    UserData,
    UserRole,
    TokenPayload,
    isValidUserRole
} from '../models/auth.models';

/**
 * Serviço de Autenticação
 * 
 * Gerencia todo o fluxo de autenticação da aplicação:
 * - Login/Logout
 * - Armazenamento seguro de tokens
 * - Decodificação de JWT
 * - Estado do usuário logado (BehaviorSubject + Signals)
 * - Verificação de perfis e permissões
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // BehaviorSubject para compatibilidade com Observables
    private currentUserSubject = new BehaviorSubject<UserData | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    // Signals para uma abordagem mais moderna (Angular 16+)
    private userSignal = signal<UserData | null>(null);
    public user = this.userSignal.asReadonly();

    // Computed signals para estados derivados
    public isAuthenticated = computed(() => this.user() !== null);
    public isAdmin = computed(() => this.user()?.perfil === UserRole.ADMIN);
    public isProfessor = computed(() => this.user()?.perfil === UserRole.PROFESSOR);
    public isAluno = computed(() => this.user()?.perfil === UserRole.ALUNO);
    public isServidor = computed(() => this.user()?.perfil === UserRole.SERVIDOR);

    constructor(
        private apiService: ApiService,
        private router: Router
    ) {
        this.loadUserFromStorage();
    }

    /**
     * Realiza login do usuário
     * @param credentials Email e senha
     * @returns Observable com a resposta do login
     */
    login(credentials: LoginCredentials): Observable<LoginResponse> {
        return this.apiService.post<LoginResponse>('/api/v1/auth/login', credentials).pipe(
            tap(response => {
                this.handleLoginSuccess(response);
            }),
            catchError(error => {
                console.error('Erro no login:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Realiza logout do usuário
     * Limpa tokens e estado, redireciona para login
     */
    logout(): void {
        this.clearStorage();
        this.clearUserState();
        this.router.navigate(['/login']);
    }

    /**
     * Processa sucesso do login
     * Salva tokens e decodifica informações do usuário
     */
    private handleLoginSuccess(response: LoginResponse): void {
        // Salvar tokens
        this.setToken(response.access_token);
        this.setRefreshToken(response.refresh_token);

        // Decodificar token e extrair dados do usuário
        const userData = this.decodeToken(response.access_token);

        if (userData) {
            this.setUserData(userData);
        }
    }

    /**
     * Decodifica o JWT e extrai os dados do usuário
     * @param token JWT token
     * @returns Dados do usuário ou null
     */
    private decodeToken(token: string): UserData | null {
        try {
            // Decodificar JWT manualmente (base64)
            const payload = token.split('.')[1];
            const decodedPayload: TokenPayload = JSON.parse(atob(payload));

            // Validar perfil
            if (!isValidUserRole(decodedPayload.perfil)) {
                console.error('Perfil inválido no token:', decodedPayload.perfil);
                return null;
            }

            // Converter para UserData
            const userData: UserData = {
                id: parseInt(decodedPayload.sub, 10),
                email: decodedPayload.email,
                nomeCompleto: decodedPayload.nome,
                perfil: decodedPayload.perfil,
                ativo: true // Assumir ativo se o token foi emitido
            };

            return userData;
        } catch (error) {
            console.error('Erro ao decodificar token:', error);
            return null;
        }
    }

    /**
     * Verifica se o token está expirado
     * @param token JWT token
     * @returns true se expirado
     */
    private isTokenExpired(token: string): boolean {
        try {
            const payload = token.split('.')[1];
            const decodedPayload: TokenPayload = JSON.parse(atob(payload));
            const exp = decodedPayload.exp * 1000; // Converter para milissegundos
            return Date.now() >= exp;
        } catch {
            return true;
        }
    }

    /**
     * Obtém o access token armazenado
     * @returns Token ou null
     */
    getToken(): string | null {
        const token = localStorage.getItem(environment.tokenKey);

        // Verificar se o token existe e não está expirado
        if (token && this.isTokenExpired(token)) {
            console.warn('Token expirado');
            this.logout();
            return null;
        }

        return token;
    }

    /**
     * Obtém o refresh token armazenado
     * @returns Refresh token ou null
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(environment.refreshTokenKey);
    }

    /**
     * Salva o access token
     */
    private setToken(token: string): void {
        localStorage.setItem(environment.tokenKey, token);
    }

    /**
     * Salva o refresh token
     */
    private setRefreshToken(token: string): void {
        localStorage.setItem(environment.refreshTokenKey, token);
    }

    /**
     * Define os dados do usuário no estado da aplicação
     */
    private setUserData(userData: UserData): void {
        localStorage.setItem(environment.userKey, JSON.stringify(userData));
        this.currentUserSubject.next(userData);
        this.userSignal.set(userData);
    }

    /**
     * Limpa o estado do usuário
     */
    private clearUserState(): void {
        this.currentUserSubject.next(null);
        this.userSignal.set(null);
    }

    /**
     * Limpa todos os dados do localStorage
     */
    private clearStorage(): void {
        localStorage.removeItem(environment.tokenKey);
        localStorage.removeItem(environment.refreshTokenKey);
        localStorage.removeItem(environment.userKey);
    }

    /**
     * Carrega dados do usuário do localStorage (ao iniciar app)
     */
    private loadUserFromStorage(): void {
        const token = this.getToken();

        if (!token) {
            return;
        }

        // Verificar se o token está válido
        if (this.isTokenExpired(token)) {
            this.logout();
            return;
        }

        // Tentar carregar dados do usuário do localStorage
        const userJson = localStorage.getItem(environment.userKey);

        if (userJson) {
            try {
                const userData: UserData = JSON.parse(userJson);
                this.currentUserSubject.next(userData);
                this.userSignal.set(userData);
            } catch (error) {
                console.error('Erro ao carregar usuário do storage:', error);
                this.logout();
            }
        } else {
            // Se não houver dados no storage, decodificar do token
            const userData = this.decodeToken(token);
            if (userData) {
                this.setUserData(userData);
            } else {
                this.logout();
            }
        }
    }

    /**
     * Verifica se o usuário está autenticado (observable)
     * @returns true se autenticado
     */
    isAuthenticatedSync(): boolean {
        return this.isAuthenticated();
    }

    /**
     * Obtém o usuário atual
     * @returns Dados do usuário ou null
     */
    getCurrentUser(): UserData | null {
        return this.currentUserSubject.value;
    }

    /**
     * Verifica se o usuário tem um perfil específico
     * @param role Perfil a verificar
     * @returns true se o usuário tem o perfil
     */
    hasRole(role: UserRole): boolean {
        const user = this.getCurrentUser();
        return user?.perfil === role;
    }

    /**
     * Verifica se o usuário tem um dos perfis especificados
     * @param roles Array de perfis
     * @returns true se o usuário tem algum dos perfis
     */
    hasAnyRole(roles: UserRole[]): boolean {
        const user = this.getCurrentUser();
        return user ? roles.includes(user.perfil) : false;
    }

    /**
     * Refresh do access token (implementar conforme necessidade)
     * @returns Observable com novo token
     */
    refreshToken(): Observable<LoginResponse> {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            this.logout();
            return throwError(() => ({ detail: 'Refresh token não encontrado' }));
        }

        return this.apiService.post<LoginResponse>('/auth/refresh', {
            refresh_token: refreshToken
        }).pipe(
            tap(response => {
                this.setToken(response.access_token);
                this.setRefreshToken(response.refresh_token);
            }),
            catchError(error => {
                this.logout();
                return throwError(() => error);
            })
        );
    }
}
