import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { commonTestProviders } from '../../../testing/test-providers';
import { AuthService } from '../../core/services/auth.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';
import { ProfileComponent } from './profile';

describe('Profile V2 navigation', () => {
  beforeEach(() => {
    const collection = signal(null);
    TestBed.configureTestingModule({
      providers: [
        ...commonTestProviders,
        provideRouter(
          routes
            .filter((route) => route.path?.startsWith('profile'))
            .map((route) => ({ ...route, canActivate: [] })),
        ),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'owner', email: 'owner@example.test' }),
            getToken: () => 'owner-token',
          },
        },
        {
          provide: CommitmentService,
          useValue: { commitments: signal([]), archivedCommitments: signal([]) },
        },
        {
          provide: MeroCustomizationService,
          useValue: {
            collection,
            loading: signal(false),
            saving: signal(false),
            loadError: signal(null),
            isUnlocked: computed(() => false),
            customGlowName: signal('Custom Aura'),
            customGlowColor: signal('#8b5cf6'),
            effectiveGlowColor: signal(null),
            effectiveGlowGradient: signal('none'),
            activeTheme: signal({ name: 'Golden Warmth' }),
            refresh: vi.fn(async () => {}),
          },
        },
      ],
    });
  });

  it('opens each real Profile destination directly and keeps a Profile return link', async () => {
    const harness = await RouterTestingHarness.create('/profile');
    expect(harness.routeNativeElement?.querySelector('app-username-settings')).toBeNull();
    for (const section of ['account', 'badges', 'colors', 'settings']) {
      const component = await harness.navigateByUrl('/profile/' + section, ProfileComponent);
      expect(component.section).toBe(section);
      expect(
        harness.routeNativeElement
          ?.querySelector('a[aria-label="Back to Profile"]')
          ?.getAttribute('href'),
      ).toBe('/profile');
    }
    await harness.navigateByUrl('/profile', ProfileComponent);
    expect(harness.routeNativeElement?.querySelector('input')).toBeNull();
  });
});
