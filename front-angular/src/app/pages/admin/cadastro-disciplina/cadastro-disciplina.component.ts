import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { HeaderComponent } from "../../../components/header/header.component";
import { FooterComponent } from "../../../components/footer/footer.component";
import { ApiService } from '../../../core/services/api.service';

interface Disciplina {
  id_disciplina: number;
  nome: string;
}

interface DisciplinasResponse {
  items: Disciplina[];
  total: number;
  offset: number;
  limit: number;
}

@Component({
  selector: 'app-cadastro-disciplina',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './cadastro-disciplina.component.html',
  styleUrl: './cadastro-disciplina.component.scss'
})
export class CadastroDisciplinaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  // Formulário reativo
  disciplinaForm!: FormGroup;

  // Estado do componente
  disciplinas = signal<Disciplina[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  editingId = signal<number | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  // Paginação
  totalDisciplinas = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  pageSizeOptions = [5, 10, 25, 50];

  // Configuração da tabela
  displayedColumns: string[] = ['id', 'nome', 'acoes'];

  ngOnInit(): void {
    this.initForm();
    this.carregarDisciplinas();
  }

  /**
   * Inicializa o formulário com validadores
   */
  private initForm(): void {
    this.disciplinaForm = this.fb.group({
      nome: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        this.nomeUnicoValidator.bind(this)
      ]]
    });
  }

  /**
   * Validador customizado para evitar nomes duplicados
   */
  private nomeUnicoValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const nomeLowerCase = control.value.toLowerCase().trim();
    const editandoId = this.editingId();

    // Verifica se já existe uma disciplina com esse nome (exceto a que está sendo editada)
    const jaExiste = this.disciplinas().some(d =>
      d.nome.toLowerCase().trim() === nomeLowerCase && d.id_disciplina !== editandoId
    );

    return jaExiste ? { nomeJaExiste: true } : null;
  }

  /**
   * Carrega a lista de disciplinas
   */
  carregarDisciplinas(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const offset = this.pageIndex() * this.pageSize();
    const limit = this.pageSize();

    this.apiService.get<DisciplinasResponse>(`/api/v1/disciplinas/?offset=${offset}&limit=${limit}`).subscribe({
      next: (response: DisciplinasResponse) => {
        this.disciplinas.set(response.items);
        this.totalDisciplinas.set(response.total);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Erro ao carregar disciplinas:', error);
        this.errorMessage.set('Erro ao carregar disciplinas. Tente novamente.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Manipula mudanças de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregarDisciplinas();
  }

  /**
   * Salva ou atualiza uma disciplina
   */
  onSubmit(): void {
    if (this.disciplinaForm.invalid) {
      this.disciplinaForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const nome = this.disciplinaForm.value.nome.trim().toUpperCase();
    const editandoId = this.editingId();

    if (editandoId) {
      // Modo de edição
      this.apiService.put<Disciplina>(`/api/v1/disciplinas/${editandoId}`, { nome }).subscribe({
        next: () => {
          this.successMessage.set('Disciplina atualizada com sucesso!');
          this.carregarDisciplinas();
          this.cancelarEdicao();
          this.isSaving.set(false);
          this.limparMensagensAposDelay();
        },
        error: (error: any) => {
          console.error('Erro ao atualizar disciplina:', error);
          this.tratarErro(error);
          this.isSaving.set(false);
        }
      });
    } else {
      // Modo de criação
      this.apiService.post<Disciplina>('/api/v1/disciplinas/', { nome }).subscribe({
        next: () => {
          this.successMessage.set('Disciplina criada com sucesso!');
          this.pageIndex.set(0); // Volta para primeira página ao criar
          this.carregarDisciplinas();
          this.disciplinaForm.reset();
          this.isSaving.set(false);
          this.limparMensagensAposDelay();
        },
        error: (error: any) => {
          console.error('Erro ao criar disciplina:', error);
          this.tratarErro(error);
          this.isSaving.set(false);
        }
      });
    }
  }

  /**
   * Prepara o formulário para edição
   */
  editarDisciplina(disciplina: Disciplina): void {
    this.editingId.set(disciplina.id_disciplina);
    this.disciplinaForm.patchValue({
      nome: disciplina.nome
    });
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Cancela a edição e volta ao modo de criação
   */
  cancelarEdicao(): void {
    this.editingId.set(null);
    this.disciplinaForm.reset();
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Remove uma disciplina
   */
  removerDisciplina(disciplina: Disciplina): void {
    console.log('Removendo disciplina:', disciplina);
    if (!confirm(`Tem certeza que deseja remover a disciplina "${disciplina.nome}"?`)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.apiService.delete<void>(`/api/v1/disciplinas/${disciplina.id_disciplina}`).subscribe({
      next: () => {
        this.successMessage.set('Disciplina removida com sucesso!');
        this.carregarDisciplinas();
        this.limparMensagensAposDelay();
      },
      error: (error: any) => {
        console.error('Erro ao remover disciplina:', error);
        this.tratarErro(error);
      }
    });
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
      this.errorMessage.set('Disciplina já cadastrada.');
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
   * Getter para facilitar acesso ao controle nome
   */
  get nome() {
    return this.disciplinaForm.get('nome');
  }

  /**
   * Retorna a mensagem de erro para o campo nome
   */
  getNomeErrorMessage(): string {
    if (this.nome?.hasError('required')) {
      return 'Nome da disciplina é obrigatório';
    }
    if (this.nome?.hasError('minlength')) {
      return 'Nome deve ter no mínimo 3 caracteres';
    }
    if (this.nome?.hasError('maxlength')) {
      return 'Nome deve ter no máximo 100 caracteres';
    }
    if (this.nome?.hasError('nomeJaExiste')) {
      return 'Esta disciplina já está cadastrada';
    }
    return '';
  }

  /**
   * Verifica se está em modo de edição
   */
  isEditMode(): boolean {
    return this.editingId() !== null;
  }
}
