import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { MeroCollection } from '@mehrchain/shared-data';
import { ProfileComponent } from './profile';
import { commonTestProviders } from '../../../testing/test-providers';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { AuthService } from '../../core/services/auth.service';
import { MeroMoodService } from '../../core/services/mero-mood.service';
import { ActivatedRoute } from '@angular/router';

describe('Profile color collection', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let collection: ReturnType<typeof signal<MeroCollection>>;
  let customization: any;
  let habits: ReturnType<typeof signal<any[]>>;

  beforeEach(async () => {
    collection = signal<MeroCollection>({
      unlockedAt: null,
      capacity: 0,
      collectionDays: 0,
      acceptedPartners: 0,
      nextDayTarget: 0,
      nextPartnerTarget: 1,
      selectedSlot: 0,
      preferencesInitialized: false,
      hasSentSupport: false,
      currentStreak: 20,
      colors: [],
    });
    habits = signal([]);
    customization = {
      collection,
      isUnlocked: computed(() => !!collection().unlockedAt),
      loading: signal(false),
      saving: signal(false),
      loadError: signal<string | null>(null),
      customGlowColor: computed(
        () =>
          collection().colors.find((c) => c.slot === collection().selectedSlot)?.hex ?? '#8b5cf6',
      ),
      customGlowName: computed(
        () =>
          collection().colors.find((c) => c.slot === collection().selectedSlot)?.name ??
          'Custom Aura',
      ),
      effectiveGlowGradient: signal('radial-gradient(circle, #f59e0b, transparent)'),
      effectiveGlowColor: signal<string | null>(null),
      activeTheme: computed(() => ({ name: 'Golden Warmth' })),
      refresh: vi.fn(async () => {}),
      saveColor: vi.fn(async () => {}),
      selectColor: vi.fn(async () => {}),
    };
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        ...commonTestProviders,
        { provide: ActivatedRoute, useValue: { snapshot: { data: { section: 'colors' } } } },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'owner', name: 'Owner', timeZone: 'UTC' }),
            getToken: () => 'remote-owner',
          },
        },
        {
          provide: CommitmentService,
          useValue: { commitments: habits, archivedCommitments: signal([]) },
        },
        { provide: MeroCustomizationService, useValue: customization },
        { provide: MeroMoodService, useValue: { mood: signal('sad') } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function unlock() {
    collection.update((c) => ({
      ...c,
      unlockedAt: '2026-10-20T12:00:00Z',
      capacity: 2,
      nextDayTarget: 42,
      nextPartnerTarget: 3,
      acceptedPartners: 1,
      currentStreak: 0,
    }));
    fixture.detectChanges();
  }

  it('keeps day 20 locked and the permanent milestone unlocked after the current streak falls to zero', () => {
    expect(component.isCustomThemeUnlocked()).toBe(false);
    unlock();
    expect(component.isCustomThemeUnlocked()).toBe(true);
    expect(component.badges().find((b) => b.id === '21-day-master')?.isUnlocked).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Next slot');
  });

  it('does not award social badges for a public habit, and requires actual accepted/sent evidence', () => {
    habits.set([{ isPublic: true, currentDay: 0 }]);
    expect(component.badges().find((b) => b.id === 'chain-starter')?.isUnlocked).toBe(false);
    expect(component.badges().find((b) => b.id === 'kind-soul')?.isUnlocked).toBe(false);
    unlock();
    expect(component.badges().find((b) => b.id === 'chain-starter')?.isUnlocked).toBe(true);
    expect(component.badges().find((b) => b.id === 'kind-soul')?.isUnlocked).toBe(false);
    collection.update((c) => ({ ...c, hasSentSupport: true }));
    expect(component.badges().find((b) => b.id === 'kind-soul')?.isUnlocked).toBe(true);
  });

  it('preserves failed drafts and does not show saved feedback before confirmation', async () => {
    unlock();
    component.beginEdit(2);
    component.customNameInput.set('My draft');
    component.customColorInput.set('#06b6d4');
    let reject!: (reason: Error) => void;
    customization.saveColor.mockImplementationOnce(
      () =>
        new Promise<void>((_, fail) => {
          reject = fail;
        }),
    );
    const saving = component.saveCustomGlow();
    expect(component.saveFeedbackMessage()).toBeNull();
    reject(new Error('Could not save. Retry.'));
    await saving;
    fixture.detectChanges();
    expect(component.saveFailed()).toBe(true);
    expect(component.customNameInput()).toBe('My draft');
    expect(component.editingSlot()).toBe(2);
  });

  it('loads saved input after an asynchronous read and keeps a dirty draft during later refreshes', () => {
    unlock();
    collection.update((c) => ({
      ...c,
      selectedSlot: 1,
      colors: [{ slot: 1, name: 'Aurora', hex: '#06b6d4' }],
    }));
    fixture.detectChanges();
    expect(component.customNameInput()).toBe('Aurora');
    component.beginEdit(2);
    component.customNameInput.set('Unfinished');
    collection.update((c) => ({ ...c, collectionDays: 2 }));
    fixture.detectChanges();
    expect(component.customNameInput()).toBe('Unfinished');
    expect(component.editingSlot()).toBe(2);
  });

  it('renders names as text rather than HTML', () => {
    unlock();
    collection.update((c) => ({
      ...c,
      colors: [{ slot: 1, name: '<img src=x>', hex: '#06b6d4' }],
    }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('<img src=x>');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('cancels a draft without mutating saved colors or earned capacity', () => {
    unlock();
    collection.update((c) => ({
      ...c,
      selectedSlot: 1,
      colors: [{ slot: 1, name: 'Saved', hex: '#06b6d4' }],
    }));
    fixture.detectChanges();
    component.beginEdit(2);
    component.customNameInput.set('Unpublished');
    component.customColorInput.set('#f43f5e');
    expect(component.previewGlowColor()).toBe('#f43f5e');
    fixture.detectChanges();
    const cancel = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Cancel preview',
    )!;
    expect(cancel).toBeTruthy();
    cancel.click();
    expect(component.previewGlowColor()).toBeUndefined();
    expect(component.customNameInput()).toBe('Saved');
    expect(collection().selectedSlot).toBe(1);
    expect(collection().capacity).toBe(2);
    expect(customization.saveColor).not.toHaveBeenCalled();
    expect(customization.selectColor).not.toHaveBeenCalled();
  });

  it('keeps the overview compact and exposes all four real destinations', () => {
    TestBed.inject(ActivatedRoute).snapshot.data['section'] = 'overview';
    const overview = TestBed.createComponent(ProfileComponent);
    overview.detectChanges();
    const element: HTMLElement = overview.nativeElement;
    const links = [...element.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(
      expect.arrayContaining([
        '/profile/account',
        '/profile/badges',
        '/profile/colors',
        '/profile/settings',
      ]),
    );
    expect(element.querySelector('input')).toBeNull();
    expect(element.querySelector('app-username-settings')).toBeNull();
    expect(element.querySelector('app-password-setup')).toBeNull();
    expect(element.querySelector('app-mero')).not.toBeNull();
    overview.destroy();
  });
});
