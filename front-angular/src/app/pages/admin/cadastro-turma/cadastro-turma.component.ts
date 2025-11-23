import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, distinctUntilChanged, map, catchError, startWith, filter, tap, finalize } from 'rxjs/operators';
import { FooterComponent } from "../../../components/footer/footer.component";
import { HeaderComponent } from "../../../components/header/header.component";

// --- Interfaces ---
interface Professor {
  id_professor: number;
  nome: string;
  cpf?: string;
}

interface Disciplina {
  id_disciplina: number;
  nome: string;
}

interface Turma {
  id_turma?: number;
  nome: string;
  serie: string;
  turno: 'MANHA' | 'TARDE' | 'NOITE';
  ano_letivo: number;
  id_disciplina: number;
  id_professor: number;
}

@Component({
  selector: 'app-cadastro-turma',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    FooterComponent,
    HeaderComponent
  ],
  templateUrl: './cadastro-turma.component.html',
  styleUrl: './cadastro-turma.component.scss'
})
export class CadastroTurmaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  turmaForm!: FormGroup;

  // Observables
  filteredProfessores!: Observable<Professor[]>;
  filteredDisciplinas!: Observable<Disciplina[]>;

  // Signals para estado de UI
  isLoadingProfessor = signal(false);
  isLoadingDisciplina = signal(false);
  isSaving = signal(false);
  editingId = signal<number | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  turnosOptions = [
    { value: 'MANHA', label: 'Manhã' },
    { value: 'TARDE', label: 'Tarde' },
    { value: 'NOITE', label: 'Noite' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.setupAutocompleteProfessor();
    this.setupAutocompleteDisciplina();
  }

  private initForm(): void {
    this.turmaForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      serie: ['', Validators.required],
      turno: ['', Validators.required],
      ano_letivo: [new Date().getFullYear(), Validators.required],

      // Controles visuais (search)
      professorSearch: ['', Validators.required],
      disciplinaSearch: ['', Validators.required],

      // Controles de valor (Ids)
      id_professor: [null, Validators.required],
      id_disciplina: [null, Validators.required]
    });
  }

  // --- LÓGICA DO PROFESSOR ---

  private setupAutocompleteProfessor(): void {
    const searchControl = this.turmaForm.get('professorSearch');

    this.filteredProfessores = searchControl!.valueChanges.pipe(
      startWith(''),
      tap(value => {
        if (typeof value === 'string' && this.turmaForm.get('id_professor')?.value) {
          this.turmaForm.patchValue({ id_professor: null });
        }
      }),
      debounceTime(300),
      distinctUntilChanged(),
      filter((value): value is string => {
        const isString = typeof value === 'string';
        // Reduzi para 1 para facilitar testes se necessário, mas 2 é ideal
        return isString && value.trim().length >= 1;
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
            console.log('🔍 Debug API Professor:', response);

            // 1. Se for Array (Lista padrão)
            if (Array.isArray(response)) return response;

            // 2. Se for Objeto Paginado
            if (response && Array.isArray(response.items)) return response.items;
            if (response && Array.isArray(response.content)) return response.content;

            // 3. CORREÇÃO CRÍTICA: Se for um Objeto Único válido (o caso que estava falhando)
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
      startWith(''),
      tap(value => {
        if (typeof value === 'string' && this.turmaForm.get('id_disciplina')?.value) {
          this.turmaForm.patchValue({ id_disciplina: null });
        }
      }),
      debounceTime(300),
      distinctUntilChanged(),
      filter((value): value is string => {
        const isString = typeof value === 'string';
        return isString && value.trim().length >= 1;
      }),
      switchMap((value) => {
        this.isLoadingDisciplina.set(true);
        const params = new HttpParams().set('nome', value.trim());

        return this.apiService.get<any>('/api/v1/disciplinas/buscar', params).pipe(
          map(response => {
            console.log('🔍 Debug API Disciplina:', response);

            // 1. Se for Array
            if (Array.isArray(response)) return response;

            // 2. Se for Objeto Paginado
            if (response && Array.isArray(response.items)) return response.items;
            if (response && Array.isArray(response.content)) return response.content;

            // 3. CORREÇÃO CRÍTICA: Se for Objeto Único (seu caso atual)
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

  // --- UTILITÁRIOS ---

  maskCpf(cpf: string): string {
    if (!cpf) return '';
    const v = cpf.replace(/\D/g, '');
    if (v.length !== 11) return cpf;
    return `${v.substring(0, 3)}.***.***-${v.substring(9, 11)}`;
  }

  resetForm(): void {
    this.turmaForm.reset({ ano_letivo: new Date().getFullYear() });
    this.editingId.set(null);
  }

  isEditMode(): boolean {
    return this.editingId() !== null;
  }

  onSubmit(): void {
    console.log('Formulário enviado com valores:', this.turmaForm.value);
    if (this.turmaForm.invalid) {
      this.turmaForm.markAllAsTouched();
      if (!this.turmaForm.value.id_professor) {
        this.turmaForm.get('professorSearch')?.setErrors({ required: true });
      }
      if (!this.turmaForm.value.id_disciplina) {
        this.turmaForm.get('disciplinaSearch')?.setErrors({ required: true });
      }
      return;
    }

    this.isSaving.set(true);

    const payload = this.turmaForm.value;
    const finalPayload: Turma = {
      nome: payload.nome.toUpperCase(),
      serie: payload.serie.toUpperCase(),
      turno: payload.turno,
      ano_letivo: payload.ano_letivo,
      id_professor: payload.id_professor,
      id_disciplina: payload.id_disciplina
    };

    console.log('Enviando payload:', finalPayload);

    this.apiService.post<Turma>('/api/v1/turmas/', finalPayload).subscribe({
      next: (response) => {
        console.log('Turma criada com sucesso:', response);
        this.resetForm();
        this.successMessage.set('Turma criada com sucesso!');
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Erro ao criar turma:', error);
        this.errorMessage.set('Erro ao criar turma. Tente novamente.');
        this.isSaving.set(false);
      }
    });
  }
}