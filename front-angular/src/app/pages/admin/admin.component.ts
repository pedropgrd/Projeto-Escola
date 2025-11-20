import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SharedModule } from '../../shared';
import { HeaderComponent } from "../../components/header/header.component";
import { ApiService } from '../../core/services/api.service';
import { HttpParams } from '@angular/common/http';
import { EditAlunoDialogComponent } from './edit-aluno-dialog/edit-aluno-dialog.component';
import { EditProfessorDialogComponent } from './edit-professor-dialog/edit-professor-dialog.component';

interface Aluno {
  id_aluno: number;
  id_usuario: number;
  matricula: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  endereco: string;
  telefone: string;
  criado_em: string;
  atualizado_em: string | null;
}

interface Professor {
  id_professor: number;
  id_usuario: number;
  nome: string;
  cpf: string;
  email: string;
  endereco: string;
  telefone: string;
  criado_em: string;
  atualizado_em: string | null;
}

interface AlunoListResponse {
  items: Aluno[];
  total: number;
  offset: number;
  limit: number;
}

interface ProfessorListResponse {
  items: Professor[];
  total: number;
  offset: number;
  limit: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    SharedModule,
    HeaderComponent
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);

  // Signals para gerenciamento de estado
  alunos = signal<Aluno[]>([]);
  professores = signal<Professor[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Toggle entre alunos e professores
  viewMode = signal<'alunos' | 'professores'>('alunos');

  // Paginação
  currentPage = signal(1);
  totalAlunos = signal(0);
  totalProfessores = signal(0);
  itemsPerPage = signal(10);
  itemsPerPageOptions = [10, 20, 30, 50, 100];
  totalPages = signal(0);

  // Busca
  searchQuery = '';

  alunosEndPoint = '/api/v1/alunos/';
  professoresEndPoint = '/api/v1/professores/';

  // Expor Math para o template
  Math = Math;

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Alterna entre visualização de alunos e professores
   */
  toggleView(mode: 'alunos' | 'professores'): void {
    this.viewMode.set(mode);
    this.currentPage.set(1);
    this.searchQuery = '';
    this.loadData();
  }

  /**
   * Carrega dados baseado no modo atual
   */
  loadData(): void {
    // if (this.viewMode() === 'alunos') {
      this.loadAlunos();
    // } else {
      this.loadProfessores();
    // }
  }

  /**
   * Atualiza quantidade de itens por página
   */
  onItemsPerPageChange(): void {
    this.currentPage.set(1);
    this.loadData();
  }

  /**
   * Carrega lista de alunos com paginação e busca
   */
  loadAlunos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const offset = (this.currentPage() - 1) * this.itemsPerPage();


    let params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', this.itemsPerPage().toString());

    // Adicionar busca se houver query
    if (this.searchQuery.trim()) {
      // Se a API suportar parâmetro de busca, adicione aqui
      // params = params.set('search', this.searchQuery.trim());
    }

    this.apiService.get<AlunoListResponse>(this.alunosEndPoint, params).subscribe({
      next: (response) => {
        this.alunos.set(response.items || []);
        this.totalAlunos.set(response.total || 0);
        this.totalPages.set(Math.ceil(response.total / this.itemsPerPage()));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar alunos:', error);
        this.errorMessage.set('Erro ao carregar lista de alunos');
        this.isLoading.set(false);
        this.alunos.set([]);
      }
    });
  }

  /**
   * Carrega lista de professores com paginação e busca
   */
  loadProfessores(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const offset = (this.currentPage() - 1) * this.itemsPerPage();

    let params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', this.itemsPerPage().toString());

    this.apiService.get<ProfessorListResponse>(this.professoresEndPoint, params).subscribe({
      next: (response) => {
        this.professores.set(response.items || []);
        this.totalProfessores.set(response.total || 0);
        this.totalPages.set(Math.ceil(response.total / this.itemsPerPage()));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar professores:', error);
        this.errorMessage.set('Erro ao carregar lista de professores');
        this.isLoading.set(false);
        this.professores.set([]);
      }
    });
  }  /**
   * Busca alunos por texto (filtra localmente por enquanto)
   */
  onSearch(): void {
    this.currentPage.set(1);
    this.loadData();
  }

  /**
   * Filtra alunos localmente baseado na busca
   */
  get filteredAlunos(): Aluno[] {
    if (!this.searchQuery.trim()) {
      return this.alunos();
    }

    const query = this.searchQuery.toLowerCase();
    return this.alunos().filter(aluno =>
      aluno.nome.toLowerCase().includes(query) ||
      aluno.matricula.toLowerCase().includes(query) ||
      aluno.cpf.includes(query)
    );
  }

  /**
   * Filtra professores localmente baseado na busca
   */
  get filteredProfessores(): Professor[] {
    if (!this.searchQuery.trim()) {
      return this.professores();
    }

    const query = this.searchQuery.toLowerCase();
    return this.professores().filter(professor =>
      professor.nome.toLowerCase().includes(query) ||
      professor.email.toLowerCase().includes(query) ||
      professor.cpf.includes(query)
    );
  }

  /**
   * Retorna o total baseado no modo atual
   */
  get currentTotal(): number {
    return this.viewMode() === 'alunos' ? this.totalAlunos() : this.totalProfessores();
  }

  /**
   * Navega para página anterior
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadData();
    }
  }

  /**
   * Navega para próxima página
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadData();
    }
  }

  /**
   * Vai para página específica
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadData();
    }
  }

  /**
   * Calcula a idade baseado na data de nascimento
   */
  calcularIdade(dataNascimento: string): number {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  }

  /**
   * Formata telefone para exibição
   */
  formatTelefone(telefone: string): string {
    if (!telefone) return '';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    }
    return telefone;
  }

  /**
   * Formata CPF para exibição
   */
  formatCpf(cpf: string): string {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `${numeros.substring(0, 3)}.${numeros.substring(3, 6)}.${numeros.substring(6, 9)}-${numeros.substring(9)}`;
    }
    return cpf;
  }

  /**
   * Formata CPF parcialmente oculto para exibição (123.***.***-00)
   */
  formatCpfMasked(cpf: string): string {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `${numeros.substring(0, 3)}.***.***-${numeros.substring(9)}`;
    }
    return cpf;
  }

  /**
   * Abre dialog para editar aluno
   */
  openEditAlunoDialog(aluno: Aluno): void {
    const dialogRef = this.dialog.open(EditAlunoDialogComponent, {
      width: '600px',
      data: {
        id_aluno: aluno.id_aluno,
        matricula: aluno.matricula,
        nome: aluno.nome,
        cpf: aluno.cpf,
        data_nascimento: aluno.data_nascimento,
        endereco: aluno.endereco,
        telefone: aluno.telefone
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Sucesso - recarregar a lista
        this.successMessage.set('Aluno atualizado com sucesso!');
        this.loadAlunos();
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      }
    });
  }

  /**
   * Abre dialog para editar professor
   */
  openEditProfessorDialog(professor: Professor): void {
    const dialogRef = this.dialog.open(EditProfessorDialogComponent, {
      width: '600px',
      data: {
        id_professor: professor.id_professor,
        nome: professor.nome,
        cpf: professor.cpf,
        email: professor.email,
        endereco: professor.endereco,
        telefone: professor.telefone
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Sucesso - recarregar a lista
        this.successMessage.set('Professor atualizado com sucesso!');
        this.loadProfessores();
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      }
    });
  }

  /**
   * Confirma e deleta aluno
   */
  deleteAluno(aluno: Aluno): void {
    const confirmacao = confirm(`Tem certeza que deseja excluir o aluno ${aluno.nome}?\nMatrícula: ${aluno.matricula}`);

    if (!confirmacao) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.apiService.delete(`${this.alunosEndPoint}${aluno.id_aluno}`).subscribe({
      next: () => {
        this.successMessage.set(`Aluno ${aluno.nome} excluído com sucesso!`);
        this.loadAlunos();
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      },
      error: (error) => {
        console.error('Erro ao excluir aluno:', error);
        this.isLoading.set(false);
        if (error.status === 403) {
          this.errorMessage.set('Você não tem permissão para excluir alunos');
        } else if (error.status === 404) {
          this.errorMessage.set('Aluno não encontrado');
        } else {
          this.errorMessage.set('Erro ao excluir aluno. Tente novamente.');
        }
      }
    });
  }

  /**
   * Confirma e deleta professor
   */
  deleteProfessor(professor: Professor): void {
    const confirmacao = confirm(`Tem certeza que deseja excluir o professor ${professor.nome}?`);

    if (!confirmacao) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.apiService.delete(`${this.professoresEndPoint}${professor.id_professor}`).subscribe({
      next: () => {
        this.successMessage.set(`Professor ${professor.nome} excluído com sucesso!`);
        this.loadProfessores();
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      },
      error: (error) => {
        console.error('Erro ao excluir professor:', error);
        this.isLoading.set(false);
        if (error.status === 403) {
          this.errorMessage.set('Você não tem permissão para excluir professores');
        } else if (error.status === 404) {
          this.errorMessage.set('Professor não encontrado');
        } else {
          this.errorMessage.set('Erro ao excluir professor. Tente novamente.');
        }
      }
    });
  }

  /**
   * Gera array de números de páginas para exibir
   */
  get pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    // Mostrar no máximo 5 páginas
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    // Ajustar início se estiver perto do fim
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}
