import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
    selector: 'app-noticias',
    standalone: true,
    imports: [CommonModule, HeaderComponent, FooterComponent],
    templateUrl: './noticias.component.html',
    styleUrls: ['./noticias.component.scss']
})
export class NoticiasComponent {
    noticias = [
        {
            id: 1,
            titulo: 'Notícia em Desenvolvimento',
            data: '2025-11-19',
            conteudo: 'Esta página está em desenvolvimento. Em breve você poderá ver todas as notícias da escola aqui.'
        }
    ];
}
