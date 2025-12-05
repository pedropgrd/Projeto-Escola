import { Routes } from '@angular/router';
import { authGuard, publicGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // ==================== ROTAS PÚBLICAS ====================
    {
        path: '',
        loadComponent: () => import('./pages/home/home.component')
            .then(m => m.HomeComponent)
    },
    // {
    //     path: 'noticias',
    //     loadComponent: () => import('./pages/noticias/noticias.component')
    //         .then(m => m.NoticiasComponent)
    // },
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
    {
        path: 'cadastro-aluno',
        loadComponent: () => import('./pages/admin/cadastro-aluno/cadastro-aluno.component')
            .then(m => m.CadastroAlunoComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'cadastro-professor',
        loadComponent: () => import('./pages/admin/cadastro-professor/cadastro-professor.component')
            .then(m => m.CadastroProfessorComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'cadastro-disciplina',
        loadComponent: () => import('./pages/admin/cadastro-disciplina/cadastro-disciplina.component')
            .then(m => m.CadastroDisciplinaComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'cadastro-turma',
        loadComponent: () => import('./pages/admin/cadastro-turma/cadastro-turma.component')
            .then(m => m.CadastroTurmaComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'gerenciar-usuarios',
        loadComponent: () => import('./pages/admin/gerenciar-usuarios/gerenciar-usuarios.component')
            .then(m => m.GerenciarUsuariosComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'nova-noticia',
        loadComponent: () => import('./pages/admin/nova-noticia/nova-noticia.component')
            .then(m => m.NovaNoticiaComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'cadastro-servidor',
        loadComponent: () => import('./pages/admin/cadastro-servidor/cadastro-servidor.component')
            .then(m => m.CadastroServidorComponent),
        canActivate: [adminGuard]
    },


// Turmas - Usuários autenticados
    {
        path: 'turmas',
        loadComponent: () => import('./pages/turmas/turmas.component')
            .then(m => m.TurmasComponent),
        canActivate: [authGuard]
    },
    {
        path:'noticias',
        loadComponent: () => import('./pages/noticias/noticias.component')
            .then(m => m.NoticiasComponent),
        canActivate: [authGuard]
    },
    {
        path:'biblioteca',
        loadComponent: () => import('./pages/biblioteca/biblioteca.component')
            .then(m => m.BibliotecaComponent),
        canActivate: [authGuard]
    },
    // ==================== ROTA WILDCARD ====================
    {
        path: '**',
        redirectTo: ''
    }
];
