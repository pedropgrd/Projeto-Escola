import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../../core/services/api.service';


export interface ServidorDialogData {
  id_servidor: number;
  nome: string;
  cpf: string;
  email: string;
  endereco: string;
  telefone: string;
  funcao: string;
}


@Component({
  selector: 'app-edit-servidor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './edit-servidor-dialog.component.html',
  styleUrl: './edit-servidor-dialog.component.scss'
})
export class EditServidorDialogComponent {
  servidorForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<EditServidorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ServidorDialogData
  ) { }

  ngOnInit(): void {
    this.initForm();
    console.log('Dados recebidos no diálogo:', this.data);
  }

  private initForm(): void {
    this.servidorForm = this.fb.group({
      nome: [this.data.nome, [Validators.required, Validators.minLength(3)]],
      cpf: [this.data.cpf, [Validators.required, Validators.minLength(11)]],
      email: [this.data.email, [Validators.required, Validators.email]],
      endereco: [this.data.endereco, [Validators.required]],
      telefone: [this.data.telefone, [Validators.required, Validators.minLength(10)]],
      funcao: [this.data.funcao, [Validators.required]]
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.servidorForm.invalid) {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Preparar dados para envio
    const formValue = this.servidorForm.value;

    const servidorData = {
      nome: formValue.nome.toUpperCase(),
      cpf: formValue.cpf,
      email: formValue.email,
      endereco: formValue.endereco.toUpperCase(),
      telefone: formValue.telefone,
      funcao: formValue.funcao.toUpperCase()
    };

    // Chamar API para atualizar
    const endpoint = `/api/v1/servidores/${this.data.id_servidor}`;

    this.apiService.put(endpoint, servidorData).subscribe({
      next: () => {
        this.isLoading = false;
        this.dialogRef.close(true); // Retorna true para indicar sucesso
      },
      error: (error:any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Erro ao atualizar servidor. Tente novamente.';
        console.error('Erro ao atualizar servidor:', error);
      }
    });
  }

  // Helpers para validação
  hasError(field: string): boolean {
    const control = this.servidorForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.servidorForm.get(field);

    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }

    if (control?.hasError('email')) {
      return 'E-mail inválido';
    }

    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo de ${minLength} caracteres`;
    }

    return '';
  }
}
