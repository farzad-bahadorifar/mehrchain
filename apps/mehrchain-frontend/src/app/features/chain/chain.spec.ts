import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChainComponent } from './chain';
import { commonTestProviders } from '../../../testing/test-providers';
import { ChainService } from '../../core/services/chain.service';
import { CommitmentService } from '../../core/services/commitment.service';

describe('ChainComponent', () => {
  let component: ChainComponent;
  let fixture: ComponentFixture<ChainComponent>;
  let chainService: ChainService;
  let commitmentService: CommitmentService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ChainComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(ChainComponent);
    component = fixture.componentInstance;
    chainService = TestBed.inject(ChainService);
    commitmentService = TestBed.inject(CommitmentService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create ChainComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load demo chain', () => {
    component.loadDemoChain();
    expect(component.friendChains().length).toBeGreaterThan(0);
    expect(component.friendChains()[0].partnerName).toBe('sara');
  });

  it('should toggle QR modal state', () => {
    expect(component.isQrModalOpen()).toBe(false);
    component.toggleQrModal(true);
    expect(component.isQrModalOpen()).toBe(true);
    component.toggleQrModal(false);
    expect(component.isQrModalOpen()).toBe(false);
  });
});
