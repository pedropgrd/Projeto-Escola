import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// Material Imports
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ApiService } from '../../../core/services/api.service';

export interface DialogData {
  id_aluno?: number;
  id_professor?: number;
  nome: string;      // Nome da pessoa (Aluno ou Professor)
  cpf: string;       // CPF já existente no cadastro base
  vincularPara: 'ALUNO' | 'PROFESSOR';
}

@Component({
  selector: 'app-cad-login-usuario-dialog',
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
  templateUrl: './cad-login-usuario-dialog.component.html',
  styleUrls: ['./cad-login-usuario-dialog.component.scss']
})
export class CadLoginUsuarioDialogComponent implements OnInit {

  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;

  // Estados para controle de UI
  isLoading = signal(false);
  hidePassword = signal(true); // Controle do ícone de olho da senha

  constructor(
    public dialogRef: MatDialogRef<CadLoginUsuarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    // Formata o CPF que vem dos dados para exibição inicial (ex: 12345678900 -> 123.456.789-00)
    const cpfFormatado = this.formatarCpfVisual(this.data.cpf || '');

    this.form = this.fb.group({
      cpf: [cpfFormatado, [Validators.required, Validators.minLength(14)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // --- LÓGICA DE MÁSCARA E FORMATAÇÃO ---

  /**
   * Aplica máscara de CPF visualmente enquanto o usuário digita
   * Formato: 000.000.000-00
   */
  onCpfInput(event: any): void {
    let valor = event.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (valor.length > 11) valor = valor.slice(0, 11); // Limita tamanho a 11 dígitos

    // Aplica a máscara progressivamente
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    // Atualiza o valor no input sem disparar novo evento de change loop
    this.form.get('cpf')?.setValue(valor, { emitEvent: false });
  }

  /**
   * Formata uma string de CPF pura para o formato visual
   */
  private formatarCpfVisual(cpf: string): string {
    if (!cpf) return '';
    const limpo = cpf.replace(/\D/g, '');
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // --- AÇÕES DO USUÁRIO ---

  togglePassword(event: MouseEvent): void {
    event.stopPropagation(); // Evita focar no input ao clicar no ícone
    this.hidePassword.update(val => !val);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);

    const formValues = this.form.value;

    // Prepara o payload removendo a máscara do CPF (envia apenas números)
    const payload = {
      cpf: formValues.cpf.replace(/\D/g, ''),
      email: formValues.email,
      senha: formValues.senha
    };

    // Define qual endpoint chamar baseado no tipo de usuário (Aluno ou Professor)
    let endpoint = '';
    if (this.data.vincularPara === 'ALUNO') {
      endpoint = `/api/v1/alunos/${this.data.id_aluno}/vincular-usuario`;
    } else {
      endpoint = `/api/v1/professores/${this.data.id_professor}/vincular-usuario`;
    }

    this.apiService.post(endpoint, payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          // Fecha o modal retornando true para indicar sucesso
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          const msg = err?.detail || 'Erro ao vincular usuário. Verifique se o E-mail ou CPF já existem.';
          this.snackBar.open(msg, 'Fechar', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
  }
}