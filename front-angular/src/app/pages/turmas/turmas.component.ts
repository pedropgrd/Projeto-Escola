import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { SharedModule } from '../../shared';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeaderComponent } from "../../components/header/header.component";
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { HttpParams } from '@angular/common/http';

interface TurmasResponse {
  items: Turma[];
  total: number;
  offset: number;
  limit: number;
}


interface Turma {
  id_turma: number;
  nome: string;
  serie: string;
  turno: 'MANHA' | 'TARDE' | 'NOITE';
  ano_letivo: number;
  id_disciplina: number;
  id_professor: number;
  nome_disciplina: string;
  nome_professor: string;
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
export class TurmasComponent implements OnInit, OnDestroy {

  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  turmas = signal<Turma[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Controles de busca
  searchControl = new FormControl('');
  filterTypeControl = new FormControl('nome');

  // Opções de filtro
  filterOptions = [
    { value: 'nome', label: 'Nome da Turma', placeholder: 'Digite o nome da turma...', param: 'nome' },
    { value: 'serie', label: 'Série', placeholder: 'Digite a série (Ex: 5º Ano)...', param: 'serie' },
    { value: 'turno', label: 'Turno', placeholder: 'Digite o turno (MANHA, TARDE, NOITE)...', param: 'turno' },
    { value: 'professor', label: 'Professor', placeholder: 'Digite o nome do professor...', param: 'nome_professor' },
    { value: 'disciplina', label: 'Disciplina', placeholder: 'Digite o nome da disciplina...', param: 'nome_disciplina' }
  ];

  // Paginação
  totalTurmas = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  pageSizeOptions = [5, 10, 25, 50];

  // Ano atual para default
  anoAtual = new Date().getFullYear();

  turnosOptions = [
    { value: 'MANHA', label: 'Manhã' },
    { value: 'TARDE', label: 'Tarde' },
    { value: 'NOITE', label: 'Noite' }
  ];

  ngOnInit(): void {
    this.setupSearchListener();
    this.carregarTurmas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configura listener reativo para busca
   */
  private setupSearchListener(): void {
    combineLatest([
      this.searchControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged()
      ),
      this.filterTypeControl.valueChanges.pipe(
        distinctUntilChanged()
      )
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([searchTerm, filterType]) => {
        this.pageIndex.set(0); // Reset para primeira página ao buscar
        this.buscarTurmas();
      });
  }

  /**
   * Retorna o placeholder dinâmico baseado no filtro selecionado
   */
  getPlaceholder(): string {
    const selected = this.filterOptions.find(opt => opt.value === this.filterTypeControl.value);
    return selected?.placeholder || 'Digite para buscar...';
  }

  /**
   * Limpa todos os filtros e recarrega a lista completa
   */
  limparFiltros(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.filterTypeControl.setValue('nome', { emitEvent: false });
    this.pageIndex.set(0);
    this.carregarTurmas();
  }

  /**
   * Busca turmas com filtros dinâmicos
   */
  private buscarTurmas(): void {
    const searchTerm = this.searchControl.value?.trim();

    // Se não tem termo de busca, carrega lista normal
    if (!searchTerm) {
      this.carregarTurmas();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Monta os params dinamicamente
    const filterType = this.filterTypeControl.value || 'nome';
    const selectedFilter = this.filterOptions.find(opt => opt.value === filterType);
    const paramName = selectedFilter?.param || 'nome';

    let params = new HttpParams()
      .set(paramName, searchTerm)
      .set('offset', (this.pageIndex() * this.pageSize()).toString())
      .set('limit', this.pageSize().toString());

    console.log(`🔍 Buscando turmas por ${selectedFilter?.label}:`, searchTerm);

    this.apiService.get<TurmasResponse>('/api/v1/turmas/buscar', params).subscribe({
      next: (response: TurmasResponse) => {
        this.turmas.set(response.items);
        this.totalTurmas.set(response.total);
        this.isLoading.set(false);
        console.log(`✅ Encontradas ${response.total} turmas`);
      },
      error: (error: any) => {
        console.error('❌ Erro ao buscar turmas:', error);
        this.errorMessage.set('Erro ao buscar turmas. Tente novamente.');
        this.isLoading.set(false);
        // Em caso de erro, mostra lista vazia
        this.turmas.set([]);
        this.totalTurmas.set(0);
      }
    });
  }

  /**
   * Carrega a lista de turmas (sem filtros)
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
   * Manipula mudanças de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    // Se tem filtro ativo, busca com filtro, senão carrega normal
    if (this.searchControl.value?.trim()) {
      this.buscarTurmas();
    } else {
      this.carregarTurmas();
    }
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
  * Prepara o formulário para edição
  */
  // editarTurma(turma: Turma): void {
  //   this.editingId.set(turma.id_turma);

  //   this.turmaForm.patchValue({
  //     nome: turma.nome,
  //     serie: turma.serie,
  //     turno: turma.turno,
  //     ano_letivo: turma.ano_letivo,
  //     id_professor: turma.id_professor,
  //     id_disciplina: turma.id_disciplina,
  //   });

  //   this.errorMessage.set('');
  //   this.successMessage.set('');
  // }

  /**
   * Cancela a edição e volta ao modo de criação
   */
  // cancelarEdicao(): void {
  //   this.editingId.set(null);
  //   this.turmaForm.reset({ ano_letivo: this.anoAtual });
  //   this.errorMessage.set('');
  //   this.successMessage.set('');
  // }

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
}
