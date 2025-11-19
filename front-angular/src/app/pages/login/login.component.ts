import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    loginForm = {
        email: '',
        password: ''
    };

    constructor(private router: Router) { }

    onSubmit() {
        // Implementação do login será feita posteriormente
        console.log('Login:', this.loginForm);
        alert('Funcionalidade de login em desenvolvimento');
    }
}
