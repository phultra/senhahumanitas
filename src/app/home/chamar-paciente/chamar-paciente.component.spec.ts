import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChamarPacienteComponent } from './chamar-paciente.component';

describe('ChamarPacienteComponent', () => {
  let component: ChamarPacienteComponent;
  let fixture: ComponentFixture<ChamarPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChamarPacienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChamarPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
