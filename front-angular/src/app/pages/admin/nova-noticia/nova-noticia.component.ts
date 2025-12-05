import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// Material & Date
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService } from '../../../core/services/api.service';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-nova-noticia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './nova-noticia.component.html',
  styleUrl: './nova-noticia.component.scss'
})
export class NovaNoticiaComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  form: FormGroup = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    data: [new Date(), [Validators.required]], // Inicializa com data de hoje
    conteudo: ['', [Validators.required, Validators.minLength(10)]]
  });

  isSaving = signal(false);

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const rawVal = this.form.value;

    // Formata a data para YYYY-MM-DD ignorando timezone
    const dateObj = new Date(rawVal.data);
    const ano = dateObj.getFullYear();
    const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dateObj.getDate()).padStart(2, '0');

    const payload = {
      titulo: rawVal.titulo.toUpperCase(), // Título em caixa alta padrão
      data: `${ano}-${mes}-${dia}`,
      conteudo: rawVal.conteudo
    };

    this.apiService.post('/api/v1/noticias/', payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Notícia publicada com sucesso!', 'OK', { duration: 4000 });
          this.form.reset({ data: new Date() }); // Reseta mantendo a data de hoje
          // Opcional: Marcar form como pristino para limpar erros visuais
          Object.keys(this.form.controls).forEach(key => {
            this.form.get(key)?.setErrors(null);
          });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Erro ao publicar notícia.', 'Fechar', { duration: 4000 });
        }
      });
  }
}
