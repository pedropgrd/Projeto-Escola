import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAlunosTurmaDialogComponent } from './list-alunos-turma-dialog.component';

describe('ListAlunosTurmaDialogComponent', () => {
  let component: ListAlunosTurmaDialogComponent;
  let fixture: ComponentFixture<ListAlunosTurmaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListAlunosTurmaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListAlunosTurmaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
