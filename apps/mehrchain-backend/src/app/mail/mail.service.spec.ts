import { MailService } from './mail.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MailService (Unit Tests)', () => {
  let service: MailService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env['RESEND_API_KEY'];
    delete process.env['MAIL_FROM'];
    service = new MailService();
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateOtpCode', () => {
    it('should generate a 6-digit numeric string', () => {
      const code = service.generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code, 10)).toBeLessThanOrEqual(999999);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should fall back to console logging when RESEND_API_KEY is not set', async () => {
      const result = await service.sendVerificationEmail('test@example.com', 'Test User', '123456');
      expect(result).toBe(true);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should dispatch email via Resend API when RESEND_API_KEY is present', async () => {
      process.env['RESEND_API_KEY'] = 're_test_key_123';
      process.env['MAIL_FROM'] = 'MehrChain <noreply@mehrchain.com>';

      mockedAxios.post.mockResolvedValueOnce({
        data: { id: 'email_msg_123' },
      });

      const result = await service.sendVerificationEmail('user@test.com', 'Ali', '654321');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          from: 'MehrChain <noreply@mehrchain.com>',
          to: ['user@test.com'],
          subject: 'کد تأیید مهرچین: 654321',
          html: expect.stringContaining('654321'),
          text: expect.stringContaining('654321'),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer re_test_key_123',
          }),
        }),
      );
    });

    it('should handle Resend API failure gracefully and fall back without throwing', async () => {
      process.env['RESEND_API_KEY'] = 're_invalid_key';

      mockedAxios.post.mockRejectedValueOnce(new Error('Resend rate limit exceeded'));

      const result = await service.sendVerificationEmail('user@test.com', 'Sara', '999888');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });
});
