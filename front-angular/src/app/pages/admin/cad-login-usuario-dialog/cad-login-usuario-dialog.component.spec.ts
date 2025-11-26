import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadLoginUsuarioDialogComponent } from './cad-login-usuario-dialog.component';

describe('CadLoginUsuarioDialogComponent', () => {
  let component: CadLoginUsuarioDialogComponent;
  let fixture: ComponentFixture<CadLoginUsuarioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadLoginUsuarioDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadLoginUsuarioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
