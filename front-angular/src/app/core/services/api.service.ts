import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Serviço HTTP Genérico com Generics
 * 
 * Encapsula todas as operações HTTP da aplicação
 * Fornece métodos tipados e tratamento de erros centralizado
 */
@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    /**
     * GET - Buscar dados
     * @param endpoint Endpoint da API (ex: '/users', '/auth/me')
     * @param params Query params opcionais
     * @returns Observable com o tipo especificado
     */
    get<T>(endpoint: string, params?: HttpParams): Observable<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        return this.http.get<T>(url, { params, headers })
            .pipe(catchError(this.handleError));
    }

    /**
     * POST - Criar recurso
     * @param endpoint Endpoint da API
     * @param body Corpo da requisição
     * @returns Observable com o tipo especificado
     */
    post<T>(endpoint: string, body: any): Observable<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        return this.http.post<T>(url, body, { headers })
            .pipe(catchError(this.handleError));
    }

    /**
     * PUT - Atualizar recurso completo
     * @param endpoint Endpoint da API
     * @param body Corpo da requisição
     * @returns Observable com o tipo especificado
     */
    put<T>(endpoint: string, body: any): Observable<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        return this.http.put<T>(url, body, { headers })
            .pipe(catchError(this.handleError));
    }

    /**
     * PATCH - Atualizar recurso parcial
     * @param endpoint Endpoint da API
     * @param body Corpo da requisição
     * @returns Observable com o tipo especificado
     */
    patch<T>(endpoint: string, body: any): Observable<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        return this.http.patch<T>(url, body, { headers })
            .pipe(catchError(this.handleError));
    }

    /**
     * DELETE - Remover recurso
     * @param endpoint Endpoint da API
     * @returns Observable com o tipo especificado
     */
    delete<T>(endpoint: string): Observable<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        return this.http.delete<T>(url, { headers })
            .pipe(catchError(this.handleError));
    }

    /**
     * POST para upload de arquivos (FormData)
     * @param endpoint Endpoint da API
     * @param formData Dados do formulário
     * @returns Observable com o tipo especificado
     */
    upload<T>(endpoint: string, formData: FormData): Observable<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        // Não definir Content-Type para FormData - deixar o browser fazer
        return this.http.post<T>(url, formData, { headers })
            .pipe(catchError(this.handleError));
    }

    /**
     * Obtém os headers de autenticação com o token Bearer
     * @returns HttpHeaders com Authorization se o token existir
     */
    private getAuthHeaders(): HttpHeaders {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        // Obter token do localStorage
        const token = localStorage.getItem('auth_token');
        
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    }

    /**
     * Tratamento de erros centralizado
     * @param error HttpErrorResponse
     * @returns Observable com erro formatado
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Ocorreu um erro desconhecido';

        if (error.error instanceof ErrorEvent) {
            // Erro do lado do cliente
            errorMessage = `Erro: ${error.error.message}`;
        } else {
            // Erro do lado do servidor
            if (error.status === 0) {
                errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
            } else if (error.error?.detail) {
                // FastAPI retorna erros no campo 'detail'
                errorMessage = error.error.detail;
            } else if (error.message) {
                errorMessage = error.message;
            } else {
                errorMessage = `Erro ${error.status}: ${error.statusText}`;
            }
        }

        console.error('Erro na requisição:', {
            status: error.status,
            message: errorMessage,
            error: error.error
        });

        return throwError(() => ({
            detail: errorMessage,
            status: error.status
        }));
    }

    /**
     * Construir URL completa (útil para downloads, etc)
     * @param endpoint Endpoint da API
     * @returns URL completa
     */
    getFullUrl(endpoint: string): string {
        return `${this.baseUrl}${endpoint}`;
    }
}
