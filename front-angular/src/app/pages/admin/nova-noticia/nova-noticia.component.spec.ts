import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaNoticiaComponent } from './nova-noticia.component';

describe('NovaNoticiaComponent', () => {
  let component: NovaNoticiaComponent;
  let fixture: ComponentFixture<NovaNoticiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovaNoticiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovaNoticiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
