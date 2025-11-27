import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroServidorComponent } from './cadastro-servidor.component';

describe('CadastroServidorComponent', () => {
  let component: CadastroServidorComponent;
  let fixture: ComponentFixture<CadastroServidorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroServidorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroServidorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
