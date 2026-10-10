import { TestBed } from '@angular/core/testing';
import { GoogleAuthService } from './google-auth.service';
import { AuthService } from './auth.service';
import { ThemeService } from './theme.service';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let authServiceMock: { googleLogin: ReturnType<typeof vi.fn> };
  let themeServiceMock: { isDark: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceMock = {
      googleLogin: vi.fn(),
    };
    themeServiceMock = {
      isDark: vi.fn().mockReturnValue(false),
    };

    TestBed.configureTestingModule({
      providers: [
        GoogleAuthService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: ThemeService, useValue: themeServiceMock },
      ],
    });

    service = TestBed.inject(GoogleAuthService);
  });

  afterEach(() => {
    document.querySelectorAll('dialog.mehrchain-google-dialog').forEach((el) => el.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should reject if Google client ID is not configured', async () => {
    await expect(service.signInWithGoogle()).rejects.toThrow('Google sign-in is not configured yet');
  });
});
