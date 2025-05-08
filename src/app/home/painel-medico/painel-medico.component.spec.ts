import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelMedicoComponent } from './painel-medico.component';

describe('PainelMedicoComponent', () => {
  let component: PainelMedicoComponent;
  let fixture: ComponentFixture<PainelMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelMedicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelMedicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
