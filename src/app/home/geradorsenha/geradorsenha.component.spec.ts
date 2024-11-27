import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeradorsenhaComponent } from './geradorsenha.component';

describe('GeradorsenhaComponent', () => {
  let component: GeradorsenhaComponent;
  let fixture: ComponentFixture<GeradorsenhaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeradorsenhaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeradorsenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
