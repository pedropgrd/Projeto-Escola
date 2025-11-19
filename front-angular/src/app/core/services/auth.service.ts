import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
    email: string;
    senha: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface User {
    id: number;
    email: string;
    nome_completo: string;
    perfil: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
    ativo: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = '/api/v1/auth';
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        this.loadUserFromStorage();
    }

    login(credentials: LoginRequest): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                this.setToken(response.access_token);
                this.loadCurrentUser();
            })
        );
    }

    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    setToken(token: string): void {
        localStorage.setItem('access_token', token);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        // TODO: Verificar se o token não expirou
        return true;
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    private loadCurrentUser(): void {
        this.http.get<User>('/api/v1/users/me').subscribe({
            next: (user) => {
                this.currentUserSubject.next(user);
                localStorage.setItem('current_user', JSON.stringify(user));
            },
            error: () => {
                this.logout();
            }
        });
    }

    private loadUserFromStorage(): void {
        const userJson = localStorage.getItem('current_user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                this.currentUserSubject.next(user);
            } catch {
                localStorage.removeItem('current_user');
            }
        }
    }
}
