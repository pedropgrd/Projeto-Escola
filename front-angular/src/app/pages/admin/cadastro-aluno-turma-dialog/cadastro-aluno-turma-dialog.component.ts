import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Importante para seleção
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services & Components
import { ApiService } from '../../../core/services/api.service';
import { HeaderComponent } from "../../../components/header/header.component";
import { FooterComponent } from "../../../components/footer/footer.component";
import { Alunos } from '../../../interfaces/Alunos';

interface AlunosResponse {
  items: Alunos[];
  total: number;
}

interface TurmaDialogData {
  id_turma: number;
  nome_turma: string;
}

@Component({
  selector: 'app-cadastro-aluno-turma-dialog',
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
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSelectModule,
    MatListModule,
    MatSnackBarModule
  ],
  templateUrl: './cadastro-aluno-turma-dialog.component.html',
  styleUrls: ['./cadastro-aluno-turma-dialog.component.scss']
})
export class CadastroAlunoTurmaDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  // Forms e Seleção
  searchForm!: FormGroup;
  turmaForm!: FormGroup;

  // SelectionModel para gerenciar checkboxes (Permite seleção múltipla)
  selection = new SelectionModel<Alunos>(true, []);

  // Estado
  isLoading = signal(false);
  isSaving = signal(false);
  alunos = signal<Alunos[]>([]); // Dados da tabela (pagina atual)

  // Paginação
  totalAlunos = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  pageSizeOptions = [5, 10, 25, 50];

  // Ordem das colunas na tabela: seleção, matrícula, nome, cpf
  displayedColumns: string[] = ['select', 'matricula', 'nome', 'cpf'];

  constructor(
    public dialogRef: MatDialogRef<CadastroAlunoTurmaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TurmaDialogData
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.carregarAlunos();
    this.setupSearch();
  }

  private initForms(): void {
    // Form da Esquerda (Destino)
    this.turmaForm = this.fb.group({
      id_turma: [{ value: this.data.id_turma, disabled: true }, Validators.required],
      nome_turma: [{ value: this.data.nome_turma, disabled: true }]
    });

    // Form da Direita (Busca)
    this.searchForm = this.fb.group({
      termo: ['']
    });
  }

  private setupSearch(): void {
    this.searchForm.get('termo')?.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {
        this.pageIndex.set(0); // Reseta para pág 1 na busca
        if (valor && valor.length > 2) {
          this.buscarAlunos(valor);
        } else if (!valor) {
          this.carregarAlunos(); // Recarrega tudo se limpar
        }
      });
  }

  // --- CARREGAMENTO DE DADOS ---

  carregarAlunos(): void {
    this.isLoading.set(true);
    const offset = this.pageIndex() * this.pageSize();
    const limit = this.pageSize();

    this.apiService.get<AlunosResponse>(`/api/v1/alunos/?offset=${offset}&limit=${limit}`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.alunos.set(res.items);
          this.totalAlunos.set(res.total);
        },
        error: (err) => console.error(err)
      });
  }

  buscarAlunos(termo: string): void {
    this.isLoading.set(true);

    // Se forem apenas dígitos, diferenciamos CPF (11 dígitos) de matrícula (outros comprimentos numéricos).
    // Caso contrário, buscamos por nome (convertido para uppercase para manter compatibilidade com o backend).
    let param = '';
    if (/^\d+$/.test(termo)) {
      if (termo.length === 11) {
        param = `cpf=${termo}`;
      } else {
        param = `matricula=${termo}`;
      }
    } else {
      param = `nome=${termo.toUpperCase()}`;
    }

    // Note: Tipando como 'any' aqui para permitir flexibilidade na verificação
    this.apiService.get<any>(`/api/v1/alunos/buscar?${param}`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          let items: Alunos[] = [];

          if (Array.isArray(res)) {
            // Cenario 1: Retornou uma lista pura [Obj, Obj]
            items = res;
          } else if (res.items && Array.isArray(res.items)) {
            // Cenario 2: Retornou paginação { items: [Obj], total: 10 }
            items = res.items;
          } else if (res && typeof res === 'object') {
            // Cenario 3 (O seu problema): Retornou um ÚNICO objeto { id: 1... }
            // Solução: Envolvemos ele num array manualmente
            items = [res];
          }

          this.alunos.set(items);

          // Se vier objeto único ou lista sem total, calculamos o length
          const total = res.total ? res.total : items.length;
          this.totalAlunos.set(total);
        },
        error: (err) => {
          console.error('Erro na busca:', err);
          // Opcional: Limpar lista ou mostrar erro
          this.alunos.set([]);
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    // Se tiver busca ativa, mantém a busca, senão carrega paginação normal
    const termo = this.searchForm.get('termo')?.value;
    if (termo && termo.length > 2) {
      // Nota: Idealmente a busca também deve ter paginação no backend
      this.buscarAlunos(termo);
    } else {
      this.carregarAlunos();
    }
  }

  // --- LÓGICA DE SELEÇÃO (CHECKBOX) ---

  /** Verifica se todos os itens da página atual estão selecionados */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.alunos().length;
    // Atenção: Lógica simplificada. Para paginas diferentes, teria que comparar IDs cruzados
    // Aqui verificamos se a seleção atual contem todos da view atual
    const pageIds = this.alunos().map(a => a.id_aluno);
    const selectedIdsOnPage = this.selection.selected.filter(s => pageIds.includes(s.id_aluno));
    return selectedIdsOnPage.length === numRows && numRows > 0;
  }

  /** Seleciona ou remove todos da página atual */
  toggleAllRows(): void {
    if (this.isAllSelected()) {
      // Remove da seleção apenas os que estão nesta página
      const pageIds = this.alunos().map(a => a.id_aluno);
      const toRemove = this.selection.selected.filter(s => pageIds.includes(s.id_aluno));
      this.selection.deselect(...toRemove);
    } else {
      // Adiciona todos da página atual
      this.selection.select(...this.alunos());
    }
  }

  // --- MÁSCARA CPF ---

  maskCpfHidden(cpf: string): string {
    if (!cpf) return '';
    // Formata: 12345678900 -> 123.***.***-00
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
  }

  // --- SUBMIT (FORKJOIN) ---

  onSubmit(): void {
    const alunosSelecionados = this.selection.selected;
    const idTurma = this.data.id_turma;

    if (alunosSelecionados.length === 0 || !idTurma) return;

    this.isSaving.set(true);

    // Cria um array de Observables (uma requisição para cada aluno)
    const requests = alunosSelecionados.map(aluno =>
      this.apiService.post('/api/v1/aluno-turma/', {
        id_aluno: aluno.id_aluno,
        id_turma: idTurma
      })
    );

    // Executa todas em paralelo
    forkJoin(requests)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (results) => {
          this.snackBar.open(`${results.length} alunos matriculados com sucesso!`, 'OK', { duration: 4000 });
          this.dialogRef.close(true); // Fecha e avisa que atualizou
        },
        error: (err) => {
          console.error(err);
          // Melhoria: Identificar qual falhou, mas aqui avisamos erro genérico
          this.snackBar.open('Erro ao matricular alguns alunos. Verifique se já não estão na turma.', 'Fechar', { duration: 5000 });
        }
      });
  }
}