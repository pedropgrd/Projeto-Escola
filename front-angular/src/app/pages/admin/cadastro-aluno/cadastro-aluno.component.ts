import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { ApiService } from '../../../core/services/api.service';

interface AlunoForm {
  nome: string;
  cpf: string;
  data_nascimento: string;
  endereco: string;
  telefone: string;
  matricula: string;
  id_usuario: number | null;
}

interface AlunoCreateDTO {
  nome: string;
  cpf: string;
  data_nascimento: string;
  endereco: string;
  telefone: string;
  matricula: string;
  id_usuario: number;
}

@Component({
  selector: 'app-cadastro-aluno',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './cadastro-aluno.component.html',
  styleUrl: './cadastro-aluno.component.scss'
})
export class CadastroAlunoComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);

  // Form model
  alunoForm: AlunoForm = {
    nome: '',
    cpf: '',
    data_nascimento: '',
    endereco: '',
    telefone: '',
    matricula: '',
    id_usuario: null
  };

  // Signals para estados
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  endPoint: string = '/api/v1/alunos/';

  // Lista de usuários carregada do backend
  users: any[] = [];
  // Sugestões filtradas conforme digita no nome
  filteredUsers: any[] = [];
  // Email do usuário selecionado (apenas para exibição)
  selectedUserEmail: string | null = null;

  onSubmit(): void {
    // Limpar mensagens anteriores
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validações básicas
    if (!this.validateForm()) {
      return;
    }

    // Iniciar loading
    this.isLoading.set(true);

    // Preparar dados para envio (remover formatação de CPF e telefone)
    const alunoData: AlunoCreateDTO = {
      nome: this.alunoForm.nome.trim(),
      cpf: this.removeFormatting(this.alunoForm.cpf),
      data_nascimento: this.alunoForm.data_nascimento,
      endereco: this.alunoForm.endereco.trim(),
      telefone: this.removeFormatting(this.alunoForm.telefone),
      matricula: this.alunoForm.matricula.trim(),
      id_usuario: this.alunoForm.id_usuario!
    };

    console.log('Enviando dados:', alunoData);

    this.apiService.post(this.endPoint, alunoData).subscribe({
      next: (response) => {
        console.log('Aluno cadastrado com sucesso:', response);
        this.successMessage.set('Aluno cadastrado com sucesso!');

        // Limpar formulário
        this.resetForm();

      },
      error: (error) => {
        console.error('Erro ao cadastrar aluno:', error);
        this.isLoading.set(false);

        // Exibir mensagem de erro
        if (error.detail) {
          this.errorMessage.set(error.detail);
        } else if (error.status === 422) {
          this.errorMessage.set('Dados inválidos. Verifique os campos e tente novamente.');
        } else if (error.status === 400) {
          this.errorMessage.set(error.detail || 'Aluno já cadastrado ou matrícula duplicada.');
        } else if (error.status === 403) {
          this.errorMessage.set('Você não tem permissão para cadastrar alunos.');
        } else if (error.status === 0) {
          this.errorMessage.set('Não foi possível conectar ao servidor.');
        } else {
          this.errorMessage.set('Erro ao cadastrar aluno. Tente novamente.');
        }
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  constructor() {
    // Carregar lista de usuários uma vez
    this.loadUsers();
  }

  validateForm(): boolean {
    // Validar nome
    if (!this.alunoForm.nome || this.alunoForm.nome.trim().length < 3) {
      this.errorMessage.set('Nome deve ter no mínimo 3 caracteres');
      return false;
    }

    // Validar CPF
    const cpfLimpo = this.removeFormatting(this.alunoForm.cpf);
    if (!cpfLimpo || cpfLimpo.length !== 11 || !/^\d+$/.test(cpfLimpo)) {
      this.errorMessage.set('CPF deve conter 11 dígitos numéricos');
      return false;
    }

    // Validar data de nascimento
    if (!this.alunoForm.data_nascimento) {
      this.errorMessage.set('Data de nascimento é obrigatória');
      return false;
    }

    // Validar telefone
    const telefoneLimpo = this.removeFormatting(this.alunoForm.telefone);
    if (!telefoneLimpo || telefoneLimpo.length < 10) {
      this.errorMessage.set('Telefone deve conter no mínimo 10 dígitos');
      return false;
    }

    // Validar matrícula
    if (!this.alunoForm.matricula || this.alunoForm.matricula.trim().length === 0) {
      this.errorMessage.set('Matrícula é obrigatória');
      return false;
    }

    // Validar ID do usuário
    if (!this.alunoForm.id_usuario || this.alunoForm.id_usuario <= 0) {
      this.errorMessage.set('ID do usuário é obrigatório');
      return false;
    }

    return true;
  }

  /**
   * Carrega todos os usuários do endpoint /api/v1/users/
   */
  loadUsers(): void {
    // Reutiliza o ApiService já injetado
    this.apiService.get<any[]>('/api/v1/users/').subscribe({
      next: (data) => {
        // Espera-se que cada item contenha: id, nome_completo, email, perfil, ativo, criado_em, atualizado_em
        this.users = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.warn('Não foi possível carregar usuários para autocomplete:', err);
        this.users = [];
      }
    });
  }

  /**
   * Chamado ao digitar no campo Nome do aluno. Filtra usuários e preenche automaticamente quando houver igualdade exata.
   */
  onNomeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const q = (input.value || '').trim();

    // Limpar seleção se nome for apagado
    if (!q) {
      this.filteredUsers = [];
      this.selectedUserEmail = null;
      this.alunoForm.id_usuario = null;
      return;
    }

    const qLower = q.toLowerCase();

    // Filtrar localmente por nome_completo e email
    this.filteredUsers = this.users.filter(u => {
      const nome = (u.nome_completo || '').toString().toLowerCase();
      const email = (u.email || '').toString().toLowerCase();
      return nome.includes(qLower) || email.includes(qLower);
    }).slice(0, 20); // limitar sugestões

    // Se houver uma correspondência exata no nome_completo, selecionar automaticamente
    const exact = this.users.find(u => (u.nome_completo || '').toString().toLowerCase() === qLower);
    if (exact) {
      this.selectUser(exact);
      // esvaziar sugestões (já selecionado)
      this.filteredUsers = [];
    } else {
      // não selecionar automaticamente
      this.selectedUserEmail = null;
      this.alunoForm.id_usuario = null;
    }
  }

  /**
   * Seleciona um usuário a partir da lista de sugestões
   */
  selectUser(user: any): void {
    if (!user) return;
    this.alunoForm.id_usuario = user.id;
    this.selectedUserEmail = user.email || null;
    // esconder sugestões para melhorar UX
    this.filteredUsers = [];
  }

  /**
   * Remove caracteres especiais, mantendo apenas números
   */
  removeFormatting(value: string): string {
    if (!value) return '';
    return value.replace(/\D/g, '');
  }

  /**
   * Aplica máscara de CPF enquanto digita
   */
  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = this.removeFormatting(input.value);

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

    this.alunoForm.cpf = value;
  }

  /**
   * Aplica máscara de telefone enquanto digita
   */
  onTelefoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = this.removeFormatting(input.value);

    // Limitar a 11 dígitos
    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    // Aplicar máscara: (00) 00000-0000 ou (00) 0000-0000
    if (value.length <= 11) {
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      if (value.length > 14) {
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
      } else {
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
      }
    }

    this.alunoForm.telefone = value;
  }

  resetForm(): void {
    this.alunoForm = {
      nome: '',
      cpf: '',
      data_nascimento: '',
      endereco: '',
      telefone: '',
      matricula: '',
      id_usuario: null
    };
  }
}
