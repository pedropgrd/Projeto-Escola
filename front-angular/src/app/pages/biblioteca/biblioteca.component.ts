import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HeaderComponent } from "../../components/header/header.component";
import { FooterComponent } from "../../components/footer/footer.component";



interface Livro {
  titulo: string;
  subtitulo?: string;
  imagem: string;
  link: string;
  categoria?: string;
}

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    HeaderComponent,
    FooterComponent
],
  templateUrl: './biblioteca.component.html',
  styleUrls: ['./biblioteca.component.scss']
})
export class BibliotecaComponent {

  livros: Livro[] = [
    {
      titulo: 'EMAI & Ler e Escrever',
      subtitulo: 'Material Educacional',
      categoria: 'Pedagogia',
      imagem: 'assets/images/biblioteca/emai_ler_escrever.png',
      link: 'https://drive.google.com/file/d/1Ni28RPv1y5kCoQSObYTcl08n48nQngu8/view'
    },
    {
      titulo: 'Ensino Híbrido na Prática',
      subtitulo: 'Metodologias Ativas',
      categoria: 'Tecnologia',
      imagem: 'assets/images/biblioteca/ensino_hibrido.png',
      link: 'https://drive.google.com/file/d/1bfoMCAcUbTf5WOO3PicEgSerrCHGQP0g/view'
    },
    {
      titulo: 'Astronomia',
      subtitulo: 'Guia Ilustrado',
      categoria: 'Ciências',
      imagem: 'assets/images/biblioteca/astronomia.png',
      link: 'https://drive.google.com/file/d/18feIeyQDkK5lIQLLI2-bYsNpR9D6oRfa/view'
    }
  ];

  abrirLivro(link: string): void {
    window.open(link, '_blank');
  }
}