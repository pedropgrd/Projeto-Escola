import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditServidorDialogComponent } from './edit-servidor-dialog.component';

describe('EditServidorDialogComponent', () => {
  let component: EditServidorDialogComponent;
  let fixture: ComponentFixture<EditServidorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditServidorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditServidorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
