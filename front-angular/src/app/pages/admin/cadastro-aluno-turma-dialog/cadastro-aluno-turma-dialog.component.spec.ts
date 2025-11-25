import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroAlunoTurmaDialogComponent } from './cadastro-aluno-turma-dialog.component';

describe('CadastroAlunoTurmaDialogComponent', () => {
  let component: CadastroAlunoTurmaDialogComponent;
  let fixture: ComponentFixture<CadastroAlunoTurmaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroAlunoTurmaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroAlunoTurmaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
