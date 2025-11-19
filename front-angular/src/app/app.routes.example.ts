/**
 * Exemplo de configuração de rotas com Guards de Autenticação
 * 
 * Este arquivo demonstra como configurar rotas protegidas
 * com diferentes níveis de acesso baseados em perfis
 */

import { Routes } from '@angular/router';
import {
    authGuard,
    publicGuard,
    adminGuard,
    professorGuard,
    alunoGuard
} from './core/guards/auth.guard';
import { UserRole } from './core/models/auth.models';

export const routes: Routes = [
    // ==================== ROTAS PÚBLICAS ====================
    {
        path: '',
        loadComponent: () => import('./pages/home/home.component')
            .then(m => m.HomeComponent)
    },
    {
        path: 'noticias',
        loadComponent: () => import('./pages/noticias/noticias.component')
            .then(m => m.NoticiasComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component')
            .then(m => m.LoginComponent),
        canActivate: [publicGuard] // Só acessa se NÃO estiver autenticado
    },

    // ==================== ROTAS PROTEGIDAS ====================

    // Rota básica - qualquer usuário autenticado
    {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.component')
            .then(m => m.PerfilComponent),
        canActivate: [authGuard]
    },

    // ==================== ROTAS ADMIN ====================
    {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/admin/dashboard/dashboard.component')
                    .then(m => m.DashboardComponent)
            },
            {
                path: 'usuarios',
                loadComponent: () => import('./pages/admin/usuarios/usuarios.component')
                    .then(m => m.UsuariosComponent)
            },
            {
                path: 'configuracoes',
                loadComponent: () => import('./pages/admin/configuracoes/configuracoes.component')
                    .then(m => m.ConfiguracoesComponent)
            }
        ]
    },

    // ==================== ROTAS PROFESSOR ====================
    // ADMIN também tem acesso
    {
        path: 'professores',
        canActivate: [professorGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/professores/lista/lista.component')
                    .then(m => m.ListaComponent)
            },
            {
                path: 'novo',
                loadComponent: () => import('./pages/professores/form/form.component')
                    .then(m => m.FormComponent)
            },
            {
                path: ':id',
                loadComponent: () => import('./pages/professores/detalhe/detalhe.component')
                    .then(m => m.DetalheComponent)
            }
        ]
    },
    {
        path: 'turmas',
        canActivate: [authGuard],
        data: { roles: [UserRole.ADMIN, UserRole.PROFESSOR] },
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/turmas/lista/lista.component')
                    .then(m => m.TurmasListaComponent)
            },
            {
                path: ':id',
                loadComponent: () => import('./pages/turmas/detalhe/detalhe.component')
                    .then(m => m.TurmasDetalheComponent)
            }
        ]
    },

    // ==================== ROTAS ALUNO ====================
    // ADMIN também tem acesso
    {
        path: 'alunos',
        canActivate: [alunoGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/alunos/lista/lista.component')
                    .then(m => m.AlunosListaComponent)
            },
            {
                path: 'matricula',
                loadComponent: () => import('./pages/alunos/matricula/matricula.component')
                    .then(m => m.MatriculaComponent)
            },
            {
                path: ':id',
                loadComponent: () => import('./pages/alunos/detalhe/detalhe.component')
                    .then(m => m.AlunosDetalheComponent)
            }
        ]
    },

    // ==================== ROTAS ESPECIAIS ====================
    {
        path: 'nao-autorizado',
        loadComponent: () => import('./pages/erro/nao-autorizado.component')
            .then(m => m.NaoAutorizadoComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
