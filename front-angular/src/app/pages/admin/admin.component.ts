import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared';
import { HeaderComponent } from "../../components/header/header.component";
import { ApiService } from '../../core/services/api.service';
import { HttpParams } from '@angular/common/http';

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

interface AlunoListResponse {
  items: Aluno[];
  total: number;
  offset: number;
  limit: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, HeaderComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private apiService = inject(ApiService);

  // Signals para gerenciamento de estado
  alunos = signal<Aluno[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Paginação
  currentPage = signal(1);
  totalAlunos = signal(0);
  itemsPerPage = 10;
  totalPages = signal(0);

  // Busca
  searchQuery = '';

  endPoint = '/api/v1/alunos/';

  // Expor Math para o template
  Math = Math;

  ngOnInit(): void {
    this.loadAlunos();
  }

  /**
   * Carrega lista de alunos com paginação e busca
   */
  loadAlunos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const offset = (this.currentPage() - 1) * this.itemsPerPage;

    let params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', this.itemsPerPage.toString());

    // Adicionar busca se houver query
    if (this.searchQuery.trim()) {
      // Se a API suportar parâmetro de busca, adicione aqui
      // params = params.set('search', this.searchQuery.trim());
    }

    this.apiService.get<AlunoListResponse>(this.endPoint, params).subscribe({
      next: (response) => {
        this.alunos.set(response.items || []);
        this.totalAlunos.set(response.total || 0);
        this.totalPages.set(Math.ceil(response.total / this.itemsPerPage));
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
   * Busca alunos por texto (filtra localmente por enquanto)
   */
  onSearch(): void {
    // Se quiser implementar busca no backend, modifique loadAlunos() para aceitar query
    // Por enquanto, vamos resetar a página e carregar
    this.currentPage.set(1);
    this.loadAlunos();
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
   * Navega para página anterior
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadAlunos();
    }
  }

  /**
   * Navega para próxima página
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadAlunos();
    }
  }

  /**
   * Vai para página específica
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadAlunos();
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
   * Confirma e deleta aluno
   */
  deleteAluno(aluno: Aluno): void {
    const confirmacao = confirm(`Tem certeza que deseja excluir o aluno ${aluno.nome}?\nMatrícula: ${aluno.matricula}`);

    if (!confirmacao) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.apiService.delete(`${this.endPoint}${aluno.id_aluno}`).subscribe({
      next: () => {
        this.successMessage.set(`Aluno ${aluno.nome} excluído com sucesso!`);

        // Recarregar lista
        this.loadAlunos();

        // Limpar mensagem após 3 segundos
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
