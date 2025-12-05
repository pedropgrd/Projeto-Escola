import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroDisciplinaComponent } from './cadastro-disciplina.component';

describe('CadastroDisciplinaComponent', () => {
  let component: CadastroDisciplinaComponent;
  let fixture: ComponentFixture<CadastroDisciplinaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroDisciplinaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroDisciplinaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
