import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/auth.models';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
    @Input() sumirTitulo: boolean = false;
    authService = inject(AuthService);
    private router = inject(Router);

    isNavbarCollapsed = signal(true);

    // Expor UserRole para uso no template
    readonly UserRole = UserRole;

    toggleNavbar(): void {
        this.isNavbarCollapsed.update(v => !v);
    }

    logout(): void {
        if (confirm('Deseja realmente sair?')) {
            this.authService.logout();
        }
    }

    goToProfile(): void {
        this.router.navigate(['/perfil']);
    }
}

