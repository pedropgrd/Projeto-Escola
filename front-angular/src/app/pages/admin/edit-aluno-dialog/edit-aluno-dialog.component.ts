import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';

export interface AlunoDialogData {
    id_aluno: number;
    matricula: string;
    nome: string;
    cpf: string;
    data_nascimento: string;
    endereco: string;
    telefone: string;
}

@Component({
    selector: 'app-edit-aluno-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule
    ],
    templateUrl: './edit-aluno-dialog.component.html',
    styleUrls: ['./edit-aluno-dialog.component.scss']
})
export class EditAlunoDialogComponent implements OnInit {
    alunoForm!: FormGroup;
    isLoading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private apiService: ApiService,
        public dialogRef: MatDialogRef<EditAlunoDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AlunoDialogData
    ) { }

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        // Converter string de data para objeto Date
        const dataNascimento = this.data.data_nascimento
            ? new Date(this.data.data_nascimento + 'T00:00:00')
            : null;

        this.alunoForm = this.fb.group({
            nome: [this.data.nome, [Validators.required, Validators.minLength(3)]],
            cpf: [this.data.cpf, [Validators.required, Validators.minLength(11)]],
            data_nascimento: [dataNascimento, [Validators.required]],
            endereco: [this.data.endereco, [Validators.required]],
            telefone: [this.data.telefone, [Validators.required, Validators.minLength(10)]]
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onSave(): void {
        if (this.alunoForm.invalid) {
            this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        // Preparar dados para envio
        const formValue = this.alunoForm.value;

        // Converter Date para string no formato YYYY-MM-DD
        const dataNascimento = formValue.data_nascimento instanceof Date
            ? formValue.data_nascimento.toISOString().split('T')[0]
            : formValue.data_nascimento;

        const alunoData = {
            nome: formValue.nome,
            cpf: formValue.cpf,
            data_nascimento: dataNascimento,
            endereco: formValue.endereco,
            telefone: formValue.telefone
        };

        // Chamar API para atualizar
        const endpoint = `/api/v1/alunos/${this.data.id_aluno}`;

        this.apiService.put(endpoint, alunoData).subscribe({
            next: () => {
                this.isLoading = false;
                this.dialogRef.close(true); // Retorna true para indicar sucesso
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.detail || 'Erro ao atualizar aluno. Tente novamente.';
                console.error('Erro ao atualizar aluno:', error);
            }
        });
    }

    // Helpers para validação
    hasError(field: string): boolean {
        const control = this.alunoForm.get(field);
        return !!(control && control.invalid && control.touched);
    }

    getErrorMessage(field: string): string {
        const control = this.alunoForm.get(field);

        if (control?.hasError('required')) {
            return 'Este campo é obrigatório';
        }

        if (control?.hasError('minlength')) {
            const minLength = control.errors?.['minlength'].requiredLength;
            return `Mínimo de ${minLength} caracteres`;
        }

        return '';
    }
}
