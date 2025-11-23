import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { ApiService } from '../../../core/services/api.service';
import { UtilService } from '../../../services/util/util.service';

interface ProfessorForm {
  nome: string;
  cpf: string;
  email: string;
  endereco: string;
  telefone: string;
}

interface ProfessorCreateDTO {
  nome: string;
  cpf: string;
  email: string;
  endereco: string;
  telefone: string;
}

@Component({
  selector: 'app-cadastro-professor',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './cadastro-professor.component.html',
  styleUrl: './cadastro-professor.component.scss'
})
export class CadastroProfessorComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private util = inject(UtilService);
  // Form model
  professorForm: ProfessorForm = {
    nome: '',
    cpf: '',
    email: '',
    endereco: '',
    telefone: ''
  };

  // Signals para estados
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Lista de usuários para autocomplete
  users: any[] = [];
  filteredUsers: any[] = [];
  selectedUserEmail: string | null = null;

  endPoint: string = '/api/v1/professores/';

  constructor() {
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);

    const professorData: ProfessorCreateDTO = {
      nome: this.professorForm.nome.trim(),
      cpf: this.util.removeFormatting(this.professorForm.cpf),
      email: this.professorForm.email.trim(),
      endereco: this.professorForm.endereco.trim(),
      telefone: this.util.removeFormatting(this.professorForm.telefone)
    };

    console.log('Enviando dados:', professorData);

    this.apiService.post(this.endPoint, professorData).subscribe({
      next: (response) => {
        console.log('Professor cadastrado com sucesso:', response);
        this.successMessage.set('Professor cadastrado com sucesso!');

        this.resetForm();

        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 2000);
      },
      error: (error) => {
        console.error('Erro ao cadastrar professor:', error);
        this.isLoading.set(false);

        if (error.detail) {
          this.errorMessage.set(error.detail);
        } else if (error.status === 422) {
          this.errorMessage.set('Dados inválidos. Verifique os campos e tente novamente.');
        } else if (error.status === 400) {
          this.errorMessage.set(error.detail || 'Professor já cadastrado ou CPF duplicado.');
        } else if (error.status === 403) {
          this.errorMessage.set('Você não tem permissão para cadastrar professores.');
        } else if (error.status === 0) {
          this.errorMessage.set('Não foi possível conectar ao servidor.');
        } else {
          this.errorMessage.set('Erro ao cadastrar professor. Tente novamente.');
        }
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  validateForm(): boolean {
    if (!this.professorForm.nome || this.professorForm.nome.trim().length < 3) {
      this.errorMessage.set('Nome deve ter no mínimo 3 caracteres');
      return false;
    }

    const cpfLimpo = this.util.removeFormatting(this.professorForm.cpf);
    if (!cpfLimpo || cpfLimpo.length !== 11 || !/^\d+$/.test(cpfLimpo)) {
      this.errorMessage.set('CPF deve conter 11 dígitos numéricos');
      return false;
    }

    if (!this.professorForm.email || !this.isValidEmail(this.professorForm.email)) {
      this.errorMessage.set('E-mail inválido');
      return false;
    }

    const telefoneLimpo = this.util.removeFormatting(this.professorForm.telefone);
    if (!telefoneLimpo || telefoneLimpo.length < 10) {
      this.errorMessage.set('Telefone deve conter no mínimo 10 dígitos');
      return false;
    }

    return true;
  }

  loadUsers(): void {
    this.apiService.get<any[]>('/api/v1/users/').subscribe({
      next: (data) => {
        this.users = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.warn('Não foi possível carregar usuários:', err);
        this.users = [];
      }
    });
  }

  onNomeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const q = (input.value || '').trim();

    if (!q) {
      this.filteredUsers = [];
      this.selectedUserEmail = null;
      this.professorForm.cpf = '';
      return;
    }

    const qLower = q.toLowerCase();

    this.filteredUsers = this.users.filter(u => {
      const nome = (u.nome_completo || '').toString().toLowerCase();
      const email = (u.email || '').toString().toLowerCase();
      return nome.includes(qLower) || email.includes(qLower);
    }).slice(0, 20);

    const exact = this.users.find(u => (u.nome_completo || '').toString().toLowerCase() === qLower);
    if (exact) {
      this.selectUser(exact);
      this.filteredUsers = [];
    } else {
      this.selectedUserEmail = null;
      this.professorForm.cpf = '';
    }
  }

  selectUser(user: any): void {
    if (!user) return;
    this.professorForm.cpf = user.cpf;
    this.selectedUserEmail = user.email || null;
    this.filteredUsers = [];
  }


  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = this.util.removeFormatting(input.value);

    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    this.professorForm.cpf = value;
  }

  onTelefoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = this.util.removeFormatting(input.value);

    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    if (value.length <= 11) {
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      if (value.length > 14) {
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
      } else {
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
      }
    }

    this.professorForm.telefone = value;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  resetForm(): void {
    this.professorForm = {
      nome: '',
      cpf: '',
      email: '',
      endereco: '',
      telefone: '',
    };
    this.selectedUserEmail = null;
    this.filteredUsers = [];
  }
}
