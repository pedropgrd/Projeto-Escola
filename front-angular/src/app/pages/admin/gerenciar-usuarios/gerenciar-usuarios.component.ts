import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

// Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ApiService } from '../../../core/services/api.service';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { UpdateSenhaUserDialogComponent } from '../update-senha-user-dialog/update-senha-user-dialog.component';


export interface Usuario {
  id: number;
  cpf: string;
  email: string;
  perfil: string;
  ativo: boolean;
  criado_em: string;
}

interface UserResponse {
  items: Usuario[]; // Payload era array direto no exemplo, mas ajustando para padrão API REST se necessário
  total?: number;
}

@Component({
  selector: 'app-gerenciar-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './gerenciar-usuarios.component.html',
  styleUrls: ['./gerenciar-usuarios.component.scss']
})
export class GerenciarUsuariosComponent implements OnInit {

  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Estados
  isLoading = signal(true);
  usuarios = signal<Usuario[]>([]);

  // Paginação
  totalUsers = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);
  pageSizeOptions = [5, 10, 25, 50];

  displayedColumns: string[] = ['id', 'cpf', 'email', 'perfil', 'status', 'acoes'];

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.isLoading.set(true);
    // Parametros 'skip' e 'limit' conforme solicitado
    const skip = this.pageIndex() * this.pageSize();
    const limit = this.pageSize();

    this.apiService.get<any>(`/api/v1/users/?skip=${skip}&limit=${limit}`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          // Tratamento robusto: Verifica se veio Array direto ou Objeto { items, total }
          if (Array.isArray(res)) {
            this.usuarios.set(res);
            this.totalUsers.set(res.length + skip); // Estimativa se backend não mandar total
          } else {
            this.usuarios.set(res.items || []);
            this.totalUsers.set(res.total || 0);
          }
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Erro ao carregar usuários.', 'Fechar', { duration: 3000 });
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregarUsuarios();
  }

  // AÇÕES

  desativarUsuario(user: Usuario): void {
    if (!confirm(`Tem certeza que deseja desativar o usuário ${user.email}?`)) return;

    this.isLoading.set(true);
    this.apiService.delete(`/api/v1/users/${user.id}`)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Usuário desativado com sucesso.', 'OK', { duration: 3000 });
          this.carregarUsuarios();
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Erro ao desativar usuário.', 'Fechar', { duration: 3000 });
        }
      });
  }

  abrirTrocaSenha(user: Usuario): void {
    const dialogRef = this.dialog.open(UpdateSenhaUserDialogComponent, {
      width: 'auto',
      data: { id: user.id, email: user.email },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Nada a fazer na lista, apenas feedback visual já dado no dialog
      }
    });
  }

  // UTILITÁRIOS

  formatCpf(cpf: string): string {
    if (!cpf) return '-';
    // Formata 12345678900 -> 123.***.***-00 (Oculto para segurança na listagem)
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
  }
}