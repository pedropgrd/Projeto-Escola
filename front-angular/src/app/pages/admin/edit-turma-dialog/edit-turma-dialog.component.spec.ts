import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTurmaDialogComponent } from './edit-turma-dialog.component';

describe('EditTurmaDialogComponent', () => {
  let component: EditTurmaDialogComponent;
  let fixture: ComponentFixture<EditTurmaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTurmaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTurmaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
