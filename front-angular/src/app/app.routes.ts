import { Routes } from '@angular/router';
import { authGuard, publicGuard, adminGuard } from './core/guards/auth.guard';

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

    // Admin - Apenas administradores
    {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin.component')
            .then(m => m.AdminComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'cadastro-login',
        loadComponent: () => import('./pages/admin/cadastro-login/cadastro-login.component')
            .then(m => m.CadastroLoginComponent),
        canActivate: [adminGuard]
    },


    // ==================== ROTA WILDCARD ====================
    {
        path: '**',
        redirectTo: ''
    }
];
