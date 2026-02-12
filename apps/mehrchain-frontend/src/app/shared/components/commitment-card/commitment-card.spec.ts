import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommitmentCardComponent } from './commitment-card';

describe('CommitmentCard', () => {
  let component: CommitmentCardComponent;
  let fixture: ComponentFixture<CommitmentCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommitmentCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommitmentCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
