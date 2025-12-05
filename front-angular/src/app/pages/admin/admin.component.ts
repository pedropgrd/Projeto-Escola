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
import { FooterComponent } from "../../components/footer/footer.component";
import { CadLoginUsuarioDialogComponent } from './cad-login-usuario-dialog/cad-login-usuario-dialog.component';
import { EditServidorDialogComponent } from './edit-servidor-dialog/edit-servidor-dialog.component';
import { AuthService } from '../../core/services/auth.service';

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
  nome_responsavel: string;
  email_usuario: string | null;
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
  email_usuario: string | null;
}

interface Servidor {
  id_servidor: number;
  id_usuario: number;
  nome: string;
  cpf: string;
  email: string;
  endereco: string;
  telefone: string;
  criado_em: string;
  atualizado_em: string | null;
  email_usuario: string | null;
  funcao: string;
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

interface ServidorListResponse {
  items: Servidor[];
  total: number;
  offset: number;
  limit: number;
}

interface ServidorListResponse {
  items: Servidor[];
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
  auth = inject(AuthService);

  // Signals para gerenciamento de estado
  alunos = signal<Aluno[]>([]);
  professores = signal<Professor[]>([]);
  servidores = signal<Servidor[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Controle do Menu Lateral
  isSidebarOpen = signal(false);

  // Toggle entre alunos, professores e servidores
  viewMode = signal<'alunos' | 'professores' | 'servidores'>('alunos');

  // Paginação
  currentPage = signal(1);
  totalAlunos = signal(0);
  totalProfessores = signal(0);
  totalServidores = signal(0);
  itemsPerPage = signal(10);
  itemsPerPageOptions = [10, 20, 30, 50, 100];
  totalPages = signal(0);

  // Busca
  searchQuery = '';

  alunosEndPoint = '/api/v1/alunos/';
  professoresEndPoint = '/api/v1/professores/';
  servidoresEndPoint = '/api/v1/servidores/';

  // Expor Math para o template
  Math = Math;

  ngOnInit(): void {
    this.loadData();
  }

  // Lógica de Toggle do Menu
  toggleSidebar() {
    this.isSidebarOpen.update(val => !val);
  }

  // Fecha o menu ao clicar num link (UX Mobile)
  closeSidebar() {
    if (window.innerWidth < 992) {
      this.isSidebarOpen.set(false);
    }
  }

  /**
   * Alterna entre visualização de alunos, professores e servidores
   */
  toggleView(mode: 'alunos' | 'professores' | 'servidores'): void {
    this.viewMode.set(mode);
    this.currentPage.set(1);
    this.searchQuery = '';
    this.loadData();
  }

  /**
   * Carrega dados baseado no modo atual
   */
  loadData(): void {
    this.loadAlunos();
    this.loadProfessores();
    this.loadServidores();
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
  }

  /**
   * Carrega lista de servidores com paginação e busca
   */
  loadServidores(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const offset = (this.currentPage() - 1) * this.itemsPerPage();

    let params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', this.itemsPerPage().toString());

    // Busca específica para servidores usando o endpoint /buscar
    let endpoint = this.servidoresEndPoint;
    if (this.searchQuery.trim() && this.viewMode() === 'servidores') {
      endpoint = '/api/v1/servidores/buscar';
      const query = this.searchQuery.trim();

      // Verifica se é CPF (apenas números) ou nome
      const isNumeric = /^\d+$/.test(query.replace(/\D/g, ''));
      if (isNumeric) {
        params = params.set('cpf', query.replace(/\D/g, ''));
      } else {
        params = params.set('nome', query);
      }
    }

    this.apiService.get<ServidorListResponse | Servidor>(endpoint, params).subscribe({
      next: (response) => {
        // Verifica se a resposta é um objeto único ou uma lista
        if (Array.isArray(response)) {
          // Caso seja array direto (improvável, mas tratado)
          this.servidores.set(response);
          this.totalServidores.set(response.length);
        } else if ('items' in response) {
          // Caso seja ServidorListResponse (padrão)
          this.servidores.set(response.items || []);
          this.totalServidores.set(response.total || 0);
        } else {
          // Caso seja um objeto único Servidor
          this.servidores.set([response as Servidor]);
          this.totalServidores.set(1);
        }

        this.totalPages.set(Math.ceil(this.totalServidores() / this.itemsPerPage()));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar servidores:', error);
        this.errorMessage.set('Erro ao carregar lista de servidores');
        this.isLoading.set(false);
        this.servidores.set([]);
      }
    });
  }

  /**
   * Busca alunos por texto (filtra localmente por enquanto)
   * Para servidores, faz busca server-side
   */
  onSearch(): void {
    this.currentPage.set(1);
    if (this.viewMode() === 'servidores') {
      this.loadServidores(); // Busca server-side para servidores
    } else {
      this.loadData(); // Busca local para alunos e professores
    }
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
   * Filtra servidores localmente baseado na busca
   * (Desabilitado: busca agora é server-side via /api/v1/servidores/buscar)
   */
  get filteredServidores(): Servidor[] {
    return this.servidores();
  }

  /**
   * Retorna o total baseado no modo atual
   */
  get currentTotal(): number {
    if (this.viewMode() === 'alunos') return this.totalAlunos();
    if (this.viewMode() === 'professores') return this.totalProfessores();
    return this.totalServidores();
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

  openCadAlunoLogin(aluno: Aluno): void {
    const dialogRef = this.dialog.open(CadLoginUsuarioDialogComponent, {
      width: 'auto',
      data: {
        id_aluno: aluno.id_aluno,
        cpf: aluno.cpf,
        nome: aluno.nome,
        vincularPara: 'ALUNO'
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Sucesso - recarregar a lista
        this.successMessage.set('Usuário vinculado com sucesso!');
        this.loadAlunos();
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      }
    });
  }

  // Exemplo para Professor
  openCadLoginProfessor(prof: Professor): void {
    const dialogRef = this.dialog.open(CadLoginUsuarioDialogComponent, {
      width: 'auto', // Ajuste a largura se preferir
      data: {
        id_professor: prof.id_professor, // ID Específico
        cpf: prof.cpf,
        nome: prof.nome, // Mudamos a prop da interface para 'nome' genérico
        vincularPara: 'PROFESSOR' // Flag Importante
      },
      disableClose: false,
      autoFocus: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Sucesso - recarregar a lista
        this.successMessage.set('Usuário vinculado com sucesso!');
        this.loadAlunos();
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      }
    });
  }
  openCadLoginServidores(serv: Servidor): void {
    const dialogRef = this.dialog.open(CadLoginUsuarioDialogComponent, {
      width: 'auto',
      data: {
        id_servidor: serv.id_servidor,
        cpf: serv.cpf,
        nome: serv.nome,
        vincularPara: 'SERVIDOR'
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.successMessage.set('Usuário vinculado com sucesso!');
        this.loadServidores();
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      }
    });
  }

  /**
   * Abre dialog para editar servidor
   */
  openEditServidorDialog(servidor: Servidor): void {
    const dialogRef = this.dialog.open(EditServidorDialogComponent, {
      width: 'auto',
      data: {
        id_servidor: servidor.id_servidor,
        nome: servidor.nome,
        cpf: servidor.cpf,
        email: servidor.email,
        endereco: servidor.endereco,
        telefone: servidor.telefone,
        funcao: servidor.funcao
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Sucesso - recarregar a lista
        this.successMessage.set('Servidor atualizado com sucesso!');
        this.loadServidores();
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      }
    });
  }

  /**
   * Confirma e deleta servidor
   */
  deleteServidor(servidor: Servidor): void {
    const confirmacao = confirm(
      `Tem certeza que deseja excluir o servidor ${servidor.nome}?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmacao) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.apiService.delete(`${this.servidoresEndPoint}${servidor.id_servidor}`).subscribe({
      next: () => {
        this.successMessage.set(`Servidor ${servidor.nome} excluído com sucesso!`);
        this.loadServidores();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        console.error('Erro ao excluir servidor:', error);
        this.errorMessage.set('Erro ao excluir servidor. Tente novamente.');
        this.isLoading.set(false);
      }
    });
  }
}
