import { TestBed } from '@angular/core/testing';

import { Trajet } from './trajet';

describe('Trajet', () => {
  let service: Trajet;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Trajet);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
