import { authGuard } from './../../core/guards/auth.guard';
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
import { AuthService } from '../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { Alunos } from '../../interfaces/Alunos';
import { CadastroAlunoTurmaDialogComponent } from '../admin/cadastro-aluno-turma-dialog/cadastro-aluno-turma-dialog.component';
import { ListAlunosTurmaDialogComponent } from '../admin/list-alunos-turma-dialog/list-alunos-turma-dialog.component';

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
  private dialog = inject(MatDialog);

  auth = inject(AuthService);

  turmas = signal<Turma[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Controles de busca
  searchControl = new FormControl('');
  filterTypeControl = new FormControl('nome');

  // Opções de filtro
  filterOptions: any[] = [];

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

    this.filterOptions = [
      { value: 'turno', label: 'Turno', placeholder: 'Digite o turno (MANHA, TARDE, NOITE)...', param: 'turno' },
      { value: 'professor', label: 'Professor', placeholder: 'Digite o nome do professor...', param: 'nome_professor' },
      { value: 'disciplina', label: 'Disciplina', placeholder: 'Digite o nome da disciplina...', param: 'nome_disciplina' }
    ];

    // 2. Se for Admin ou Professor, adiciona estes itens no COMEÇO da lista (unshift)
    if (this.auth.isAdmin() || this.auth.isProfessor() || this.auth.isServidor()) {
      this.filterOptions.unshift(
        { value: 'nome', label: 'Nome da Turma', placeholder: 'Digite o nome da turma...', param: 'nome' },
        { value: 'serie', label: 'Série', placeholder: 'Digite a série (Ex: 5º Ano)...', param: 'serie' }
      );
    }
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
      this.searchControl.valueChanges,
      this.filterTypeControl.valueChanges
    ])
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(([searchTerm, filterType]) => {
        this.pageIndex.set(0); // Reset para primeira página ao buscar

        // Se tem termo de busca, busca na API
        if (searchTerm && searchTerm.trim()) {
          this.buscarTurmas();
        } else {
          // Se não tem busca, carrega lista normal
          this.carregarTurmas();
        }
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

    let params = new HttpParams().set(paramName, searchTerm);

    console.log(`🔍 Buscando turmas por ${selectedFilter?.label}:`, searchTerm);

    // O endpoint /buscar retorna uma lista direta, não paginada
    this.apiService.get<Turma[]>('/api/v1/turmas/buscar', params).subscribe({
      next: (turmas: Turma[]) => {
        console.log('✅ Resultado da busca de turmas:', turmas);
        this.turmas.set(turmas);
        this.totalTurmas.set(turmas.length);
        this.isLoading.set(false);
        console.log(`✅ Encontradas ${turmas.length} turmas`);
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

    // Se tem filtro ativo, não pagina (busca retorna todos os resultados)
    // Senão carrega com paginação normal
    const searchTerm = this.searchControl.value?.trim();
    if (searchTerm) {
      // Quando tem busca ativa, não recarrega (já tem todos os resultados)
      // A paginação é feita localmente pelo mat-paginator
      return;
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
  editarTurma(turma: Turma): void {
    // this.editingId.set(turma.id_turma);

    // this.turmaForm.patchValue({
    //   nome: turma.nome,
    //   serie: turma.serie,
    //   turno: turma.turno,
    //   ano_letivo: turma.ano_letivo,
    //   id_professor: turma.id_professor,
    //   id_disciplina: turma.id_disciplina,
    // });

    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Cancela a edição e volta ao modo de criação
   */
  cancelarEdicao(): void {
    // this.editingId.set(null);
    // this.turmaForm.reset({ ano_letivo: this.anoAtual });
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

  openCadAlunoTurmaDialog(turma: Turma): void {
    const dialogRef = this.dialog.open(CadastroAlunoTurmaDialogComponent, {
      width: 'auto',
      data: {
        id_turma: turma.id_turma,
        nome_turma: turma.nome
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Sucesso - recarregar a lista
        this.successMessage.set('Aluno atualizado com sucesso!');
        this.carregarTurmas();
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      }
    });
  }

  openListAlunoTurmaDialog(turma: Turma): void {
    const dialogRef = this.dialog.open(ListAlunosTurmaDialogComponent, {
      width: 'auto',
      data: {
        id_turma: turma.id_turma,
        nome_turma: turma.nome
      },
      disableClose: false,
      autoFocus: true
    });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result === true) {
    //     // Sucesso - recarregar a lista
    //     this.successMessage.set('Aluno atualizado com sucesso!');
    //     this.carregarTurmas();
    //     setTimeout(() => {
    //       this.successMessage.set('');
    //     }, 3000);
    //   }
    // });
  }

}
