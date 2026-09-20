import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile';
import { commonTestProviders } from '../../../testing/test-providers';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let customizationService: MeroCustomizationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [...commonTestProviders],
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

  it('should change glow theme when selecting an unlocked theme', () => {
    component.handleSelectTheme('ocean');
    expect(customizationService.selectedThemeId()).toBe('ocean');
    expect(component.saveFeedbackMessage()).toContain('updated successfully');
  });

  it('should show locked message when selecting a locked theme', () => {
    // 'custom' theme requires 21-day streak; default streak is 0
    component.handleSelectTheme('custom');
    expect(component.saveFeedbackMessage()).toContain('Locked!');
  });
});
