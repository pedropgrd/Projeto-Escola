import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ApiService } from '../../../core/services/api.service';

// Validador para garantir que Nova Senha e Confirmar Senha sejam iguais
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const nova = control.get('novaSenha');
  const confirma = control.get('confirmarSenha');
  return nova && confirma && nova.value === confirma.value ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-update-senha-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './update-senha-user-dialog.component.html',
  styleUrl: './update-senha-user-dialog.component.scss'
})
export class UpdateSenhaUserDialogComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    novaSenha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  isLoading = signal(false);
  hideNew = signal(true);
  hideConfirm = signal(true);

  constructor(
    public dialogRef: MatDialogRef<UpdateSenhaUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number, email: string }
  ) { }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading.set(true);

    const novaSenha = this.form.get('novaSenha')?.value;

    // AVISO: Enviando senha como Query Param conforme solicitado (endpoint?nova_senha=...)
    // Em produção, prefira enviar no Body por segurança.
    const endpoint = `/api/v1/users/${this.data.id}/password?nova_senha=${novaSenha}`;

    this.apiService.put(endpoint, {})
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Senha alterada com sucesso!', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open(`Erro ao alterar senha: ${err?.detail}.`, 'Fechar', { duration: 3000 });
        }
      });
  }
}
