/**
 * EXEMPLO DE COMPONENTE CONSUMINDO A API
 * 
 * Este arquivo demonstra as melhores práticas para
 * consumir a API usando ApiService com tipagem forte
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

// ==================== INTERFACES ====================

interface Professor {
    id: number;
    nome_completo: string;
    cpf: string;
    email: string;
    telefone: string;
    especialidade: string;
    usuario_id: number;
    ativo: boolean;
    criado_em: string;
}

interface CreateProfessorDTO {
    nome_completo: string;
    cpf: string;
    email: string;
    telefone: string;
    especialidade: string;
    senha: string;
}

// ==================== COMPONENTE ====================

@Component({
    selector: 'app-professores-exemplo',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="container">
      <h2>Gerenciamento de Professores</h2>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
      }

      <!-- Erro -->
      @if (errorMessage()) {
        <div class="alert alert-danger">
          {{ errorMessage() }}
        </div>
      }

      <!-- Lista -->
      @if (!isLoading() && professores().length > 0) {
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Especialidade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (professor of professores(); track professor.id) {
              <tr>
                <td>{{ professor.nome_completo }}</td>
                <td>{{ professor.email }}</td>
                <td>{{ professor.especialidade }}</td>
                <td>
                  <span [class]="professor.ativo ? 'badge bg-success' : 'badge bg-danger'">
                    {{ professor.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td>
                  <button 
                    class="btn btn-sm btn-primary me-2"
                    (click)="viewDetails(professor.id)">
                    Ver
                  </button>
                  @if (authService.isAdmin()) {
                    <button 
                      class="btn btn-sm btn-danger"
                      (click)="deleteProfessor(professor.id)">
                      Deletar
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <!-- Botão adicionar (apenas ADMIN) -->
      @if (authService.isAdmin()) {
        <button 
          class="btn btn-success"
          (click)="showCreateForm()">
          Adicionar Professor
        </button>
      }
    </div>
  `
})
export class ProfessoresExemploComponent implements OnInit {
    // Injeção de dependências (Angular 16+)
    private apiService = inject(ApiService);
    authService = inject(AuthService);

    // Signals para estado reativo
    professores = signal<Professor[]>([]);
    isLoading = signal(false);
    errorMessage = signal('');
    selectedProfessor = signal<Professor | null>(null);

    ngOnInit(): void {
        this.loadProfessores();
    }

    // ==================== MÉTODOS GET ====================

    /**
     * Carregar todos os professores
     */
    loadProfessores(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.apiService.get<Professor[]>('/professores').subscribe({
            next: (data) => {
                this.professores.set(data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Erro ao carregar professores:', error);
                this.errorMessage.set(error.detail || 'Erro ao carregar professores');
                this.isLoading.set(false);
            }
        });
    }

    /**
     * Buscar professor por ID
     */
    viewDetails(id: number): void {
        this.isLoading.set(true);

        this.apiService.get<Professor>(`/professores/${id}`).subscribe({
            next: (professor) => {
                this.selectedProfessor.set(professor);
                console.log('Professor:', professor);
                // Aqui você pode abrir um modal, navegar, etc.
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Erro ao buscar professor:', error);
                this.errorMessage.set('Professor não encontrado');
                this.isLoading.set(false);
            }
        });
    }

    // ==================== MÉTODOS POST ====================

    /**
     * Criar novo professor
     */
    createProfessor(data: CreateProfessorDTO): void {
        this.isLoading.set(true);

        this.apiService.post<Professor>('/professores', data).subscribe({
            next: (novoProfessor) => {
                console.log('Professor criado:', novoProfessor);

                // Adicionar à lista
                this.professores.update(profs => [...profs, novoProfessor]);

                // Mostrar mensagem de sucesso
                alert('Professor criado com sucesso!');
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Erro ao criar professor:', error);
                this.errorMessage.set(error.detail || 'Erro ao criar professor');
                this.isLoading.set(false);
            }
        });
    }

    // ==================== MÉTODOS PUT ====================

    /**
     * Atualizar professor existente
     */
    updateProfessor(id: number, data: Partial<Professor>): void {
        this.isLoading.set(true);

        this.apiService.put<Professor>(`/professores/${id}`, data).subscribe({
            next: (professorAtualizado) => {
                console.log('Professor atualizado:', professorAtualizado);

                // Atualizar na lista
                this.professores.update(profs =>
                    profs.map(p => p.id === id ? professorAtualizado : p)
                );

                alert('Professor atualizado com sucesso!');
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Erro ao atualizar professor:', error);
                this.errorMessage.set(error.detail || 'Erro ao atualizar professor');
                this.isLoading.set(false);
            }
        });
    }

    // ==================== MÉTODOS DELETE ====================

    /**
     * Deletar professor
     */
    deleteProfessor(id: number): void {
        if (!confirm('Deseja realmente deletar este professor?')) {
            return;
        }

        this.isLoading.set(true);

        this.apiService.delete<void>(`/professores/${id}`).subscribe({
            next: () => {
                console.log('Professor deletado com sucesso');

                // Remover da lista
                this.professores.update(profs => profs.filter(p => p.id !== id));

                alert('Professor deletado com sucesso!');
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Erro ao deletar professor:', error);
                this.errorMessage.set(error.detail || 'Erro ao deletar professor');
                this.isLoading.set(false);
            }
        });
    }

    // ==================== MÉTODOS AUXILIARES ====================

    showCreateForm(): void {
        // Exemplo de dados para criar professor
        const novoProfessor: CreateProfessorDTO = {
            nome_completo: 'João Silva',
            cpf: '12345678900',
            email: 'joao@escola.com',
            telefone: '11999999999',
            especialidade: 'Matemática',
            senha: 'senha123'
        };

        // Aqui você normalmente abriria um formulário
        // Este é apenas um exemplo
        if (confirm('Criar professor de exemplo?')) {
            this.createProfessor(novoProfessor);
        }
    }
}

// ==================== EXEMPLO COM OBSERVABLES (ALTERNATIVA) ====================

/**
 * Versão usando Observables em vez de Signals
 * (para quem prefere a abordagem tradicional)
 */
@Component({
    selector: 'app-professores-observable',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="container">
      @if (professores$ | async; as professores) {
        <div>Total: {{ professores.length }}</div>
        @for (prof of professores; track prof.id) {
          <div>{{ prof.nome_completo }}</div>
        }
      }
    </div>
  `
})
export class ProfessoresObservableComponent implements OnInit {
    private apiService = inject(ApiService);

    // Observable diretamente do service
    professores$ = this.apiService.get<Professor[]>('/professores');

    ngOnInit(): void {
        // Usar diretamente no template com async pipe
        // Ou subscrever se precisar processar os dados
        this.professores$.subscribe({
            next: (data) => console.log('Professores:', data),
            error: (error) => console.error('Erro:', error)
        });
    }
}

// ==================== EXEMPLO COM PAGINAÇÃO ====================

interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
}

@Component({
    selector: 'app-professores-paginado',
    standalone: true,
    imports: [CommonModule],
    template: `<div>Ver exemplo completo no código</div>`
})
export class ProfessoresPaginadoComponent {
    private apiService = inject(ApiService);

    loadProfessoresPaginado(page: number = 1, perPage: number = 10): void {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString()
        });

        this.apiService
            .get<PaginatedResponse<Professor>>(`/professores?${params}`)
            .subscribe({
                next: (response) => {
                    console.log('Página:', response.page);
                    console.log('Total:', response.total);
                    console.log('Items:', response.items);
                }
            });
    }
}

// ==================== EXEMPLO COM UPLOAD DE ARQUIVO ====================

@Component({
    selector: 'app-upload-exemplo',
    standalone: true,
    template: `<input type="file" (change)="onFileSelected($event)">`
})
export class UploadExemploComponent {
    private apiService = inject(ApiService);

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;

        if (!input.files?.length) return;

        const file = input.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('descricao', 'Foto de perfil');

        this.apiService.upload<{ url: string }>('/upload', formData).subscribe({
            next: (response) => {
                console.log('Arquivo enviado:', response.url);
            },
            error: (error) => {
                console.error('Erro no upload:', error);
            }
        });
    }
}
