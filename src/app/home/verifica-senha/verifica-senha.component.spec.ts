import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificaSenhaComponent } from './verifica-senha.component';

describe('VerificaSenhaComponent', () => {
  let component: VerificaSenhaComponent;
  let fixture: ComponentFixture<VerificaSenhaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificaSenhaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificaSenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
