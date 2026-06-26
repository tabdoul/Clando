import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrajetList } from './trajet-list';

describe('TrajetList', () => {
  let component: TrajetList;
  let fixture: ComponentFixture<TrajetList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrajetList],
    }).compileComponents();

    fixture = TestBed.createComponent(TrajetList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
