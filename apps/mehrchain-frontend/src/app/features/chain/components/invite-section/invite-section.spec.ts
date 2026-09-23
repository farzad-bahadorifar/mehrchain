import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InviteSectionComponent } from './invite-section';
import { commonTestProviders } from '../../../../../testing/test-providers';
import { Commitment } from '@mehrchain/shared-data';
import { ChainService } from '../../../../core/services/chain.service';

describe('InviteSectionComponent', () => {
  let component: InviteSectionComponent;
  let fixture: ComponentFixture<InviteSectionComponent>;
  let chainService: ChainService;

  const mockCommitments: Commitment[] = [
    {
      id: 'comm-1',
      title: 'Morning Yoga',
      category: 'health',
      totalDays: 21,
      currentDay: 5,
      currentStreak: 4,
      isCompletedToday: false,
      startDate: new Date().toISOString(),
      isPublic: true,
    },
    {
      id: 'comm-2',
      title: 'Read Books',
      category: 'growth',
      totalDays: 30,
      currentDay: 10,
      currentStreak: 10,
      isCompletedToday: true,
      startDate: new Date().toISOString(),
      isPublic: true,
    },
  ];

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [InviteSectionComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(InviteSectionComponent);
    component = fixture.componentInstance;
    chainService = TestBed.inject(ChainService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('commitments', mockCommitments);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display prompt to make habits public when commitments list is empty', () => {
    fixture.componentRef.setInput('commitments', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('mark a habit as Public');
    expect(compiled.textContent).toContain('Go to Dashboard');
  });

  it('should display selected habit and toggle dropdown', () => {
    fixture.componentRef.setInput('commitments', mockCommitments);
    fixture.detectChanges();

    expect(component.selectedCommitment()?.title).toBe('Morning Yoga');

    component.selectCommitment('comm-2');
    expect(component.selectedCommitment()?.title).toBe('Read Books');
    expect(component.isDropdownOpen()).toBe(false);
  });

  it('should toggle QR modal', () => {
    fixture.componentRef.setInput('commitments', mockCommitments);
    fixture.detectChanges();

    expect(component.isQrModalOpen()).toBe(false);
    component.toggleQrModal(true);
    expect(component.isQrModalOpen()).toBe(true);
    component.toggleQrModal(false);
    expect(component.isQrModalOpen()).toBe(false);
  });

  it('should call shareInvite and copyLinkOnly on user actions', async () => {
    const shareSpy = vi.spyOn(chainService, 'shareInvite').mockResolvedValue(true);
    const copySpy = vi.spyOn(chainService, 'copyInviteToClipboard').mockResolvedValue(true);
    let emittedToast = '';
    component.notifyToast.subscribe((msg) => (emittedToast = msg));

    fixture.componentRef.setInput('commitments', mockCommitments);
    fixture.detectChanges();

    await component.shareInviteLink();
    expect(shareSpy).toHaveBeenCalled();
    expect(emittedToast).toContain('Invite link shared');

    await component.copyLinkOnly();
    expect(copySpy).toHaveBeenCalled();
    expect(component.copied()).toBe(true);
  });
});
