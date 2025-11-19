/**
 * Enums e Types para o sistema de autenticação
 */

/**
 * Perfis de usuário do sistema (deve corresponder ao backend)
 */
export enum UserRole {
    ADMIN = 'ADMIN',
    PROFESSOR = 'PROFESSOR',
    ALUNO = 'ALUNO'
}

/**
 * Interface para o payload do JWT
 * Corresponde ao TokenData do backend
 */
export interface TokenPayload {
    sub: string;          // User ID
    email: string;
    nome: string;         // Nome completo
    perfil: UserRole;     // Role do usuário
    iat: number;          // Issued at (timestamp)
    exp: number;          // Expiration (timestamp)
    type: string;         // "access" ou "refresh"
}

/**
 * Interface para os dados do usuário logado
 */
export interface UserData {
    id: number;
    email: string;
    nomeCompleto: string;
    perfil: UserRole;
    ativo: boolean;
}

/**
 * Interface para a resposta de login
 */
export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

/**
 * Interface para as credenciais de login
 */
export interface LoginCredentials {
    email: string;
    senha: string;
}

/**
 * Interface para erro da API
 */
export interface ApiError {
    detail: string;
    status?: number;
}

/**
 * Type guard para verificar se é um UserRole válido
 */
export function isValidUserRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
}
