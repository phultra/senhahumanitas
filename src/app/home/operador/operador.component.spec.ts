import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperadorComponent } from './operador.component';

describe('OperadorComponent', () => {
  let component: OperadorComponent;
  let fixture: ComponentFixture<OperadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperadorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
