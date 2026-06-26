import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrajetForm } from './trajet-form';

describe('TrajetForm', () => {
  let component: TrajetForm;
  let fixture: ComponentFixture<TrajetForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrajetForm],
    }).compileComponents();

    fixture = TestBed.createComponent(TrajetForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
