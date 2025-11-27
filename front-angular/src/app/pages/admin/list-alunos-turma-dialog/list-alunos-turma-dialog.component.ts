import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

// Material Imports
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

// Interface baseada no JSON de exemplo
export interface AlunoDetalhado {
  id_aluno: number;
  id_turma: number;
  id_professor: number;
  id_alunoTurma: number;
  nome_aluno: string;
  matricula: string;
  turma_nome: string;
  turma_serie: string;
  nome_professor: string;
  email_professor: string;
  disciplina_nome: string;
}

interface TurmaDialogData {
  id_turma: number;
  nome_turma: string;
}

@Component({
  selector: 'app-list-alunos-turma-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './list-alunos-turma-dialog.component.html',
  styleUrl: './list-alunos-turma-dialog.component.scss'
})
export class ListAlunosTurmaDialogComponent implements OnInit {

  private apiService = inject(ApiService);
  auth = inject(AuthService);

  // Controle de Busca
  searchControl = new FormControl('');

  // Estados
  isLoading = signal(false);
  alunos = signal<AlunoDetalhado[]>([]);

  // Dados Agrupados (Professor e Turma)
  turmaInfo = signal<{ professor: string; email: string; serie: string, disciplina_nome: string } | null>(null);

  displayedColumns: string[] = [];

  id_alunoTurma: number | null = null;
  
  constructor(
    public dialogRef: MatDialogRef<ListAlunosTurmaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TurmaDialogData
  ) {
    // Define colunas dinamicamente baseado no perfil do usuário
    this.displayedColumns = ['avatar', 'matricula', 'nome'];
    if (this.auth.isAdmin()) {
      this.displayedColumns.push('acoes');
    }
  }

  ngOnInit(): void {
    this.carregarAlunos();
    this.setupSearch();
  }

  setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(termo => {
      this.carregarAlunos(termo || '');
    });
  }

  carregarAlunos(termo: string = ''): void {
    this.isLoading.set(true);

    // Monta a query param se houver termo
    const query = termo ? `?nome_aluno=${termo}` : '';

    this.apiService.get<AlunoDetalhado[]>(`/api/v1/aluno-turma/turma/${this.data.id_turma}/alunos-detalhado${query}`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.alunos.set(response);
          // Lógica de Agrupamento:
          // Pegamos os dados do primeiro aluno para preencher o cabeçalho da turma/professor
          if (response.length > 0 && !this.turmaInfo()) {
            const info = response[0];
            this.turmaInfo.set({
              professor: info.nome_professor,
              email: info.email_professor,
              serie: info.turma_serie,
              disciplina_nome: info.disciplina_nome,
            });
          }
        },
        error: (error) => {
          console.error('Erro ao carregar alunos:', error);
          this.alunos.set([]);
        }
      });
  }

  // Utilitário para gerar iniciais para o Avatar (ex: Mariana Ferraz -> MF)
  getInitials(nome: string): string {
    if (!nome) return '';
    const parts = nome.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Utilitário para cores aleatórias consistentes baseadas no nome
  getAvatarColor(nome: string): string {
    const colors = ['#e57373', '#ba68c8', '#64b5f6', '#4db6ac', '#ffd54f', '#ff8a65', '#a1887f'];
    let hash = 0;
    for (let i = 0; i < nome.length; i++) {
      hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  }


  desvicularAluno(alunoTurma: AlunoDetalhado): void {
    if (!confirm(`Tem certeza que deseja desvincular o aluno ${alunoTurma.nome_aluno} da turma ${this.data.nome_turma}?`)) {
      return;
    }

    this.isLoading.set(true);

    this.apiService.delete(`/api/v1/aluno-turma/${alunoTurma.id_alunoTurma}`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          // Remover aluno da lista localmente
          const alunosAtualizados = this.alunos().filter(a => a.id_alunoTurma !== alunoTurma.id_alunoTurma);
          this.alunos.set(alunosAtualizados);
        },
        error: (error) => {
          console.error('Erro ao desvincular aluno:', error);
          alert('Erro ao desvincular aluno. Tente novamente.');
        }
      });
  }
}