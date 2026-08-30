import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../../testing/test-providers';
import { NewCommitmentModal } from './new-commitment-modal';

describe('NewCommitmentModal', () => {
  let component: NewCommitmentModal;
  let fixture: ComponentFixture<NewCommitmentModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCommitmentModal],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(NewCommitmentModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
