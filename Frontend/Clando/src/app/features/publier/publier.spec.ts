import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Publier } from './publier';

describe('Publier', () => {
  let component: Publier;
  let fixture: ComponentFixture<Publier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Publier],
    }).compileComponents();

    fixture = TestBed.createComponent(Publier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
