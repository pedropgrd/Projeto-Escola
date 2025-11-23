import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable } from 'rxjs';
import { SharedModule } from '../../shared';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeaderComponent } from "../../components/header/header.component";
import { FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
interface Professor {
  id_professor: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco: string;
}

interface Disciplina {
  id_disciplina: number;
  nome: string;
}


interface TurmasResponse {
  items: Turma[];
  total: number;
  offset: number;
  limit: number;
}

interface ProfessoresResponse {
  items: Professor[];
  total: number;
}

interface Turma {
  id_turma: number;
  nome: string;
  serie: string;
  turno: 'MANHA' | 'TARDE' | 'NOITE';
  ano_letivo: number;
  id_disciplina: number;
  id_professor: number;
  disciplina?: Disciplina;
  professor?: Professor;
}

@Component({
  selector: 'app-turmas',
  standalone: true,
  imports: [
    SharedModule,
    FooterComponent,
    HeaderComponent
  ],
  templateUrl: './turmas.component.html',
  styleUrl: './turmas.component.scss'
})
export class TurmasComponent {

  private apiService = inject(ApiService);

  turmaForm!: FormGroup;
  turmas = signal<Turma[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  editingId = signal<number | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  // Paginação
  totalTurmas = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  pageSizeOptions = [5, 10, 25, 50];

  // Observables para autocomplete
  filteredProfessores!: Observable<Professor[]>;
  filteredDisciplinas!: Observable<Disciplina[]>;

  // Ano atual para default
  anoAtual = new Date().getFullYear();

  turnosOptions = [
    { value: 'MANHA', label: 'Manhã' },
    { value: 'TARDE', label: 'Tarde' },
    { value: 'NOITE', label: 'Noite' }
  ];
  
  constructor() {
    this.carregarTurmas();
  }

  /**
   * 
   * 
   * Carrega a lista de turmas
   */
  carregarTurmas(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const offset = this.pageIndex() * this.pageSize();
    const limit = this.pageSize();

    this.apiService.get<TurmasResponse>(`/api/v1/turmas/?offset=${offset}&limit=${limit}`).subscribe({
      next: (response: TurmasResponse) => {
        this.turmas.set(response.items);
        this.totalTurmas.set(response.total);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Erro ao carregar turmas:', error);
        this.errorMessage.set('Erro ao carregar turmas. Tente novamente.');
        this.isLoading.set(false);
      }
    });
  }
  /**
    * Prepara o formulário para edição
    */
  editarTurma(turma: Turma): void {
    this.editingId.set(turma.id_turma);

    this.turmaForm.patchValue({
      nome: turma.nome,
      serie: turma.serie,
      turno: turma.turno,
      ano_letivo: turma.ano_letivo,
      id_professor: turma.id_professor,
      id_disciplina: turma.id_disciplina,
      professorSearch: turma.professor || null,
      disciplinaSearch: turma.disciplina || null
    });

    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Cancela a edição e volta ao modo de criação
   */
  cancelarEdicao(): void {
    this.editingId.set(null);
    this.turmaForm.reset({ ano_letivo: this.anoAtual });
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Remove uma turma
   */
  removerTurma(turma: Turma): void {
    if (!confirm(`Tem certeza que deseja remover a turma "${turma.nome}"?`)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.apiService.delete<void>(`/api/v1/turmas/${turma.id_turma}`).subscribe({
      next: () => {
        this.successMessage.set('Turma removida com sucesso!');
        this.carregarTurmas();
        this.limparMensagensAposDelay();
      },
      error: (error: any) => {
        console.error('Erro ao remover turma:', error);
        this.tratarErro(error);
      }
    });
  }

  /**
   * Manipula mudanças de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregarTurmas();
  }

  /**
   * Trata erros da API
   */
  private tratarErro(error: any): void {
    if (error.detail) {
      if (Array.isArray(error.detail)) {
        const messages = error.detail.map((err: any) => err.msg).join(', ');
        this.errorMessage.set(messages);
      } else if (typeof error.detail === 'string') {
        this.errorMessage.set(error.detail);
      } else {
        this.errorMessage.set('Erro ao processar requisição.');
      }
    } else if (error.status === 409) {
      this.errorMessage.set('Turma já cadastrada.');
    } else if (error.status === 0) {
      this.errorMessage.set('Não foi possível conectar ao servidor.');
    } else {
      this.errorMessage.set('Erro ao processar requisição. Tente novamente.');
    }
  }

  /**
   * Limpa mensagens após 3 segundos
   */
  private limparMensagensAposDelay(): void {
    setTimeout(() => {
      this.successMessage.set('');
      this.errorMessage.set('');
    }, 3000);
  }

  /**
   * Retorna label do turno
   */
  getTurnoLabel(turno: string): string {
    const option = this.turnosOptions.find(t => t.value === turno);
    return option ? option.label : turno;
  }

  /**
   * Verifica se está em modo de edição
   */
  isEditMode(): boolean {
    return this.editingId() !== null;
  }
}
