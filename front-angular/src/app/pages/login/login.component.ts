import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';
import { LoginCredentials } from '../../core/models/auth.models';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        MatIconModule, 
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        HeaderComponent, 
        FooterComponent
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    // Form model
    loginForm = {
        email: '',
        senha: ''
    };

    // Signals para estados
    isLoading = signal(false);
    errorMessage = signal('');
    showPassword = signal(false);

    endPointAuth: string = '/auth/login';
    onSubmit(): void {
        // Limpar mensagem de erro anterior
        this.errorMessage.set('');

        // Validações básicas
        if (!this.loginForm.email || !this.loginForm.senha) {
            this.errorMessage.set('Por favor, preencha todos os campos');
            return;
        }

        if (!this.isValidEmail(this.loginForm.email)) {
            this.errorMessage.set('Por favor, insira um e-mail válido');
            return;
        }

        // Iniciar loading
        this.isLoading.set(true);

        const credentials: LoginCredentials = {
            email: this.loginForm.email,
            senha: this.loginForm.senha
        };

        this.authService.login(credentials).subscribe({
            next: () => {
                // Login bem-sucedido
                console.log('Login realizado com sucesso');

                // Redirecionar para a página inicial ou returnUrl
                const returnUrl = this.getReturnUrl();
                this.router.navigate([returnUrl]);
            },
            error: (error) => {
                // Tratar erro de login
                console.error('Erro no login:', error);
                this.isLoading.set(false);

                // Exibir mensagem de erro
                if (error.detail) {
                    this.errorMessage.set(error.detail);
                } else if (error.status === 401) {
                    this.errorMessage.set('E-mail ou senha incorretos');
                } else if (error.status === 0) {
                    this.errorMessage.set('Não foi possível conectar ao servidor');
                } else {
                    this.errorMessage.set('Erro ao fazer login. Tente novamente.');
                }
            },
            complete: () => {
                this.isLoading.set(false);
            }
        });
    }

    togglePasswordVisibility(): void {
        this.showPassword.update(v => !v);
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private getReturnUrl(): string {
        // Pegar returnUrl dos query params se existir
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('returnUrl') || '/';
    }
}

