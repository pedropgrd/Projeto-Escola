import { Component, OnInit, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, distinctUntilChanged, map, catchError, startWith, filter, tap, finalize } from 'rxjs/operators';

// --- Interfaces ---
interface Turma {
  id_turma: number;
  nome: string;
  serie: string;
  turno: 'MANHA' | 'TARDE' | 'NOITE';
  ano_letivo: number;
  id_disciplina: number;
  id_professor: number;
  nome_disciplina: string;
  nome_professor: string;
}

interface Professor {
  id_professor: number;
  nome: string;
  cpf?: string;
}

interface Disciplina {
  id_disciplina: number;
  nome: string;
}

@Component({
  selector: 'app-edit-turma-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './edit-turma-dialog.component.html',
  styleUrl: './edit-turma-dialog.component.scss'
})
export class EditTurmaDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private dialogRef = inject(MatDialogRef<EditTurmaDialogComponent>);

  turmaForm!: FormGroup;

  // Observables para autocomplete
  filteredProfessores!: Observable<Professor[]>;
  filteredDisciplinas!: Observable<Disciplina[]>;

  // Signals para estado de UI
  isLoadingProfessor = signal(false);
  isLoadingDisciplina = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');

  turnosOptions = [
    { value: 'MANHA', label: 'Manhã' },
    { value: 'TARDE', label: 'Tarde' },
    { value: 'NOITE', label: 'Noite' }
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data: Turma) { }

  ngOnInit(): void {
    this.initForm();
    this.setupAutocompleteProfessor();
    this.setupAutocompleteDisciplina();
  }

  private initForm(): void {
    // Inicializa o formulário com os dados da turma atual
    this.turmaForm = this.fb.group({
      nome: [this.data.nome, [Validators.required, Validators.minLength(2)]],
      serie: [this.data.serie, Validators.required],
      turno: [this.data.turno, Validators.required],
      ano_letivo: [this.data.ano_letivo, Validators.required],

      // Controles visuais (search) - Inicializados com os nomes atuais
      professorSearch: [
        { id_professor: this.data.id_professor, nome: this.data.nome_professor },
        Validators.required
      ],
      disciplinaSearch: [
        { id_disciplina: this.data.id_disciplina, nome: this.data.nome_disciplina },
        Validators.required
      ],

      // Controles de valor (Ids) - Inicializados com os IDs atuais
      id_professor: [this.data.id_professor, Validators.required],
      id_disciplina: [this.data.id_disciplina, Validators.required]
    });
  }

  // --- LÓGICA DO PROFESSOR ---

  private setupAutocompleteProfessor(): void {
    const searchControl = this.turmaForm.get('professorSearch');

    this.filteredProfessores = searchControl!.valueChanges.pipe(
      tap(value => {
        // Limpa o ID se o usuário modificar o texto manualmente (e não for um objeto selecionado)
        if (typeof value === 'string') {
          const currentId = this.turmaForm.get('id_professor')?.value;
          // Só limpa se havia um ID e o usuário está digitando
          if (currentId && value.trim().length >= 2) {
            this.turmaForm.patchValue({ id_professor: null }, { emitEvent: false });
          }
        }
      }),
      debounceTime(300),
      distinctUntilChanged(),
      filter((value): value is string => {
        // Ignora se for um objeto (seleção existente)
        if (typeof value === 'object' && value !== null) {
          return false;
        }
        const isString = typeof value === 'string';
        return isString && value.trim().length >= 2;
      }),
      switchMap((value) => {
        this.isLoadingProfessor.set(true);
        const trimmed = value.trim();

        const isNumeric = /^\d+$/.test(trimmed);
        let params = new HttpParams();

        if (isNumeric) {
          params = params.set('cpf', trimmed.replace(/\D/g, ''));
        } else {
          params = params.set('nome', trimmed);
        }

        return this.apiService.get<any>('/api/v1/professores/buscar', params).pipe(
          map(response => {
            if (Array.isArray(response)) return response;
            if (response && Array.isArray(response.items)) return response.items;
            if (response && Array.isArray(response.content)) return response.content;
            if (response && typeof response === 'object' && response.id_professor) {
              return [response];
            }
            return [];
          }),
          catchError((err) => {
            console.error('Erro API Professor:', err);
            return of([]);
          }),
          finalize(() => this.isLoadingProfessor.set(false))
        );
      })
    );
  }

  displayProfessor(professor: Professor | null): string {
    return professor && professor.nome ? professor.nome : '';
  }

  onProfessorSelected(event: MatAutocompleteSelectedEvent): void {
    const professor: Professor = event.option.value;
    this.turmaForm.patchValue({ id_professor: professor.id_professor });
    this.turmaForm.get('professorSearch')?.setErrors(null);
  }

  // --- LÓGICA DA DISCIPLINA ---

  private setupAutocompleteDisciplina(): void {
    const searchControl = this.turmaForm.get('disciplinaSearch');

    this.filteredDisciplinas = searchControl!.valueChanges.pipe(
      tap(value => {
        // Limpa o ID se o usuário modificar o texto manualmente (e não for um objeto selecionado)
        if (typeof value === 'string') {
          const currentId = this.turmaForm.get('id_disciplina')?.value;
          // Só limpa se havia um ID e o usuário está digitando
          if (currentId && value.trim().length >= 2) {
            this.turmaForm.patchValue({ id_disciplina: null }, { emitEvent: false });
          }
        }
      }),
      debounceTime(300),
      distinctUntilChanged(),
      filter((value): value is string => {
        // Ignora se for um objeto (seleção existente)
        if (typeof value === 'object' && value !== null) {
          return false;
        }
        const isString = typeof value === 'string';
        return isString && value.trim().length >= 2;
      }),
      switchMap((value) => {
        this.isLoadingDisciplina.set(true);
        const params = new HttpParams().set('nome', value.trim());

        return this.apiService.get<any>('/api/v1/disciplinas/buscar', params).pipe(
          map(response => {
            if (Array.isArray(response)) return response;
            if (response && Array.isArray(response.items)) return response.items;
            if (response && Array.isArray(response.content)) return response.content;
            if (response && typeof response === 'object' && response.id_disciplina) {
              return [response];
            }
            return [];
          }),
          catchError((err) => {
            console.error('Erro API Disciplina:', err);
            return of([]);
          }),
          finalize(() => this.isLoadingDisciplina.set(false))
        );
      })
    );
  }

  displayDisciplina(disciplina: Disciplina | null): string {
    return disciplina && disciplina.nome ? disciplina.nome : '';
  }

  onDisciplinaSelected(event: MatAutocompleteSelectedEvent): void {
    const disciplina: Disciplina = event.option.value;
    this.turmaForm.patchValue({ id_disciplina: disciplina.id_disciplina });
    this.turmaForm.get('disciplinaSearch')?.setErrors(null);
  }

  // --- SUBMISSÃO E AÇÕES ---

  onSubmit(): void {
    // Validação: Garante que os IDs estejam preenchidos
    const hasValidProfessor = !!this.turmaForm.value.id_professor;
    const hasValidDisciplina = !!this.turmaForm.value.id_disciplina;

    if (this.turmaForm.invalid || !hasValidProfessor || !hasValidDisciplina) {
      this.turmaForm.markAllAsTouched();

      if (!hasValidProfessor) {
        this.turmaForm.get('professorSearch')?.setErrors({ required: true });
      }
      if (!hasValidDisciplina) {
        this.turmaForm.get('disciplinaSearch')?.setErrors({ required: true });
      }

      this.errorMessage.set('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const payload = {
      nome: this.turmaForm.value.nome.toUpperCase(),
      serie: this.turmaForm.value.serie.toUpperCase(),
      turno: this.turmaForm.value.turno,
      ano_letivo: this.turmaForm.value.ano_letivo,
      id_professor: this.turmaForm.value.id_professor,
      id_disciplina: this.turmaForm.value.id_disciplina
    };

    this.apiService.put<Turma>(`/api/v1/turmas/${this.data.id_turma}`, payload).subscribe({
      next: (response) => {
        console.log('Turma atualizada com sucesso:', response);
        this.dialogRef.close(true); // Retorna true em caso de sucesso
      },
      error: (error) => {
        console.error('Erro ao atualizar turma:', error);
        this.errorMessage.set('Erro ao atualizar turma. Tente novamente.');
        this.isSaving.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
