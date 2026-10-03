import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile';
import { commonTestProviders } from '../../../testing/test-providers';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { signal } from '@angular/core';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let customizationService: MeroCustomizationService;
  let streakSignal: any;

  beforeEach(async () => {
    streakSignal = signal(0);
    const mockCommitmentService = {
      overallStreak: streakSignal,
      commitments: signal([]),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        ...commonTestProviders,
        { provide: CommitmentService, useValue: mockCommitmentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    customizationService = TestBed.inject(MeroCustomizationService);
    fixture.detectChanges();
  });

  it('should create the profile component', () => {
    expect(component).toBeTruthy();
  });

  it('should allow editing and saving nickname', () => {
    component.startEditingNickname();
    expect(component.isEditingNickname()).toBe(true);

    component.nicknameInput.set('Sparky');
    component.saveNickname();

    expect(component.isEditingNickname()).toBe(false);
    expect(customizationService.nickname()).toBe('Sparky');
    expect(component.saveFeedbackMessage()).toContain('saved successfully');
  });

  it('should prevent saving custom glow when streak is less than 21', () => {
    streakSignal.set(5);
    fixture.detectChanges();

    component.saveCustomGlow();
    expect(component.saveFeedbackMessage()).toContain('unlocks at a 21-day streak');
  });

  it('should allow saving custom glow and resetting to default when streak reaches 21', () => {
    streakSignal.set(21);
    fixture.detectChanges();

    component.customColorInput.set('#06b6d4');
    component.customNameInput.set('Cyber Aurora');
    component.saveCustomGlow();

    expect(customizationService.selectedThemeId()).toBe('custom');
    expect(customizationService.customGlowColor()).toBe('#06b6d4');
    expect(customizationService.customGlowName()).toBe('Cyber Aurora');
    expect(component.saveFeedbackMessage()).toContain('saved & applied');

    // Reset to default glow
    component.resetToDefaultGlow();
    expect(customizationService.selectedThemeId()).toBe('golden');
    expect(component.saveFeedbackMessage()).toContain('Reset to default');
  });

  it('should compute 5 initial badges with correct metadata and Lucide icons in Profile', () => {
    const badges = component.badges();
    expect(badges.length).toBe(5);

    const badgeIds = badges.map((b) => b.id);
    expect(badgeIds).toEqual([
      'first-spark',
      'chain-starter',
      '7-day-streak',
      '21-day-master',
      'kind-soul',
    ]);

    const badgeIcons = badges.map((b) => b.icon);
    expect(badgeIcons).toEqual(['sparkles', 'link', 'flame', 'trophy', 'heart']);
  });

  it('should unlock streak badges in Profile when streak reaches 7 and 21', () => {
    streakSignal.set(21);
    fixture.detectChanges();

    const streak7 = component.badges().find((b) => b.id === '7-day-streak');
    const streak21 = component.badges().find((b) => b.id === '21-day-master');

    expect(streak7?.isUnlocked).toBe(true);
    expect(streak21?.isUnlocked).toBe(true);
  });
});
