import { AuthService } from './../../core/services/auth.service';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ApiService } from '../../core/services/api.service';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';


export interface Noticia {
    id_noticia: number; // Campo atualizado
    titulo: string;
    conteudo: string;
    data: string;
    criado_em?: string;
    atualizado_em?: string;
}

// Interface para resposta paginada
export interface NoticiaResponse {
    items: Noticia[];
    total: number;
    offset: number;
    limit: number;
}


export interface Noticia {
    id?: number;
    titulo: string;
    conteudo: string;
    data: string;
}


@Component({
    selector: 'app-noticias',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        HeaderComponent,
        FooterComponent,
        MatPaginator
    ],
    templateUrl: './noticias.component.html',
    styleUrls: ['./noticias.component.scss']
})
export class NoticiasComponent {
    private apiService = inject(ApiService);
    private snackBar = inject(MatSnackBar);
    authService = inject(AuthService);
    noticias = signal<Noticia[]>([]);
    isLoading = signal(true);

    // Controles de Paginação
    totalNoticias = signal(0);
    pageSize = signal(6); // 6 cards por página (visual clean)
    pageIndex = signal(0);
    pageSizeOptions = [6, 12, 18];

    ngOnInit(): void {
        this.carregarNoticias();
    }

    carregarNoticias(): void {
        this.isLoading.set(true);

        const offset = this.pageIndex() * this.pageSize();
        const limit = this.pageSize();

        this.apiService.get<NoticiaResponse>(`/api/v1/noticias/?offset=${offset}&limit=${limit}`)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (data) => {
                    this.noticias.set(data.items || []);
                    this.totalNoticias.set(data.total || 0);
                },
                error: (err) => console.error('Erro ao carregar notícias', err)
            });
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.carregarNoticias();

        // Scroll suave para o topo da lista
        const element = document.querySelector('.news-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    isNew(dataString: string): boolean {
        const dataNoticia = new Date(dataString);
        const hoje = new Date();
        const diffTime = Math.abs(hoje.getTime() - dataNoticia.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    }

    excluirNoticia(noticia: Noticia): void {
        if (!confirm(`Tem certeza que deseja excluir a notícia "${noticia.titulo}"?`)) return;

        this.isLoading.set(true);
        this.apiService.delete(`/api/v1/noticias/${noticia.id_noticia}`)
            .subscribe({
                next: () => {
                    this.snackBar.open('Notícia excluída com sucesso!', 'OK', { duration: 3000 });
                    this.carregarNoticias(); // Recarrega a lista
                },
                error: (err) => {
                    console.error(err);
                    this.isLoading.set(false); // Retira loading em caso de erro
                    this.snackBar.open('Erro ao excluir notícia.', 'Fechar', { duration: 3000 });
                }
            });
    }

}