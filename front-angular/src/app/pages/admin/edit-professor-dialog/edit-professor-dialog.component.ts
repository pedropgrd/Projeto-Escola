import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';

export interface ProfessorDialogData {
    id_professor: number;
    nome: string;
    cpf: string;
    email: string;
    endereco: string;
    telefone: string;
}

@Component({
    selector: 'app-edit-professor-dialog',
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
    templateUrl: './edit-professor-dialog.component.html',
    styleUrls: ['./edit-professor-dialog.component.scss']
})
export class EditProfessorDialogComponent implements OnInit {
    professorForm!: FormGroup;
    isLoading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private apiService: ApiService,
        public dialogRef: MatDialogRef<EditProfessorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ProfessorDialogData
    ) { }

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.professorForm = this.fb.group({
            nome: [this.data.nome, [Validators.required, Validators.minLength(3)]],
            cpf: [this.data.cpf, [Validators.required, Validators.minLength(11)]],
            email: [this.data.email, [Validators.required, Validators.email]],
            endereco: [this.data.endereco, [Validators.required]],
            telefone: [this.data.telefone, [Validators.required, Validators.minLength(10)]]
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onSave(): void {
        if (this.professorForm.invalid) {
            this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        // Preparar dados para envio
        const formValue = this.professorForm.value;

        const professorData = {
            nome: formValue.nome,
            cpf: formValue.cpf,
            email: formValue.email,
            endereco: formValue.endereco,
            telefone: formValue.telefone
        };

        // Chamar API para atualizar
        const endpoint = `/api/v1/professores/${this.data.id_professor}`;

        this.apiService.put(endpoint, professorData).subscribe({
            next: () => {
                this.isLoading = false;
                this.dialogRef.close(true); // Retorna true para indicar sucesso
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.detail || 'Erro ao atualizar professor. Tente novamente.';
                console.error('Erro ao atualizar professor:', error);
            }
        });
    }

    // Helpers para validação
    hasError(field: string): boolean {
        const control = this.professorForm.get(field);
        return !!(control && control.invalid && control.touched);
    }

    getErrorMessage(field: string): string {
        const control = this.professorForm.get(field);

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
