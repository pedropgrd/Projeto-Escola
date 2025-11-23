import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { ApiService } from '../../../core/services/api.service';
import { UserRole } from '../../../core/models/auth.models';
import { UtilService } from '../../../services/util/util.service';

interface SignupRequest {
  email: string;
  cpf: string | null;
  perfil: UserRole;
  senha: string;
}

interface SignupResponse {
  id: number;
  email: string;
  cpf: string;
  perfil: string;
  ativo: boolean;
}

@Component({
  selector: 'app-cadastro-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './cadastro-login.component.html',
  styleUrl: './cadastro-login.component.scss'
})
export class CadastroLoginComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private util = inject(UtilService);
  // Form model
  formData = {
    email: '',
    cpf: '',
    perfil: UserRole.ALUNO,
    senha: '',
    confirmarSenha: ''
  };

  // Signals para estados
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  showToast = signal(false);
  toastMessage = signal('');

  // Opções de perfil para o select
  perfis = [
    { value: UserRole.ADMIN, label: 'Administrador' },
    { value: UserRole.PROFESSOR, label: 'Professor' },
    { value: UserRole.ALUNO, label: 'Aluno' }
  ];

  onSubmit(): void {
    // Limpar mensagens anteriores
    this.errorMessage.set('');

    // Validações
    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);

    const signupData: SignupRequest = {
      email: this.formData.email,
      cpf: this.formData.cpf || null,
      perfil: this.formData.perfil,
      senha: this.formData.senha
    };

    this.apiService.post<SignupResponse>('/api/v1/auth/signup', signupData).subscribe({
      next: (response) => {
        console.log('Usuário criado com sucesso:', response);

        // Mostrar toast de sucesso
        this.toastMessage.set(`Usuário ${response.cpf} criado com sucesso!`);
        this.showToast.set(true);

        // Limpar formulário
        this.resetForm();

        // Esconder toast após 3 segundos
        setTimeout(() => {
          this.showToast.set(false);
        }, 3000);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao criar usuário:', error);
        this.isLoading.set(false);

        // Exibir mensagem de erro
        if (error.detail) {
          // Verifica se detail é um array (erros de validação do Pydantic)
          if (Array.isArray(error.detail)) {
            const messages = error.detail.map((err: any) => err.msg).join(', ');
            this.errorMessage.set(messages);
          } else if (typeof error.detail === 'string') {
            this.errorMessage.set(error.detail);
          } else {
            this.errorMessage.set('Dados inválidos. Verifique os campos.');
          }
        } else if (error.status === 400) {
          this.errorMessage.set('Dados inválidos. Verifique os campos.');
        } else if (error.status === 409) {
          this.errorMessage.set('Este e-mail já está cadastrado.');
        } else if (error.status === 0) {
          this.errorMessage.set('Não foi possível conectar ao servidor.');
        } else {
          this.errorMessage.set('Erro ao criar usuário. Tente novamente.');
        }
      }
    });
  }

  validateForm(): boolean {
    // Validar campos vazios
    if (!this.formData.email ||
      !this.formData.senha || !this.formData.confirmarSenha) {
      this.errorMessage.set('Por favor, preencha todos os campos');
      return false;
    }

    // Validar e-mail
    if (!this.isValidEmail(this.formData.email)) {
      this.errorMessage.set('Por favor, insira um e-mail válido');
      return false;
    }

    // Validar cpf (se fornecido)
    if (this.formData.cpf) {
      if (this.formData.cpf.length < 11) {
        this.errorMessage.set('CPF deve ter no mínimo 11 caracteres');
        return false;
      }
    }

    // Validar senha (mínimo 6 caracteres)
    if (this.formData.senha.length < 6) {
      this.errorMessage.set('A senha deve ter no mínimo 6 caracteres');
      return false;
    }

    // Validar confirmação de senha
    if (this.formData.senha !== this.formData.confirmarSenha) {
      this.errorMessage.set('As senhas não conferem');
      return false;
    }

    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  resetForm(): void {
    this.formData = {
      email: '',
      cpf: '',
      perfil: UserRole.ALUNO,
      senha: '',
      confirmarSenha: ''
    };
  }

  voltarParaAdmin(): void {
    this.router.navigate(['/admin']);
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = this.util.removeFormatting(input.value);

    // Limitar a 11 dígitos
    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    // Aplicar máscara: 000.000.000-00
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    this.formData.cpf = value;
  }
}
