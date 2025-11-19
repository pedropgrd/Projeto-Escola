import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    contactForm = {
        nome: '',
        telefone: '',
        email: '',
        mensagem: ''
    };

    onSubmit() {
        const { nome, telefone, email, mensagem } = this.contactForm;

        const texto = `Olá!%0AQuero entrar em contato com a escola.%0A%0A*Nome:* ${nome}%0A*Telefone:* ${telefone}%0A*Email:* ${email}%0A*Mensagem:* ${mensagem}`;

        const numero = "556333791247"; // Número da escola (WhatsApp)

        const url = `https://wa.me/${numero}?text=${texto}`;

        window.open(url, "_blank");

        // Limpar formulário após envio
        this.contactForm = {
            nome: '',
            telefone: '',
            email: '',
            mensagem: ''
        };
    }
}
