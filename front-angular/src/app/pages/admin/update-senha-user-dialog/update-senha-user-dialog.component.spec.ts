import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateSenhaUserDialogComponent } from './update-senha-user-dialog.component';

describe('UpdateSenhaUserDialogComponent', () => {
  let component: UpdateSenhaUserDialogComponent;
  let fixture: ComponentFixture<UpdateSenhaUserDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateSenhaUserDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateSenhaUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
