import { IsValidEmailConstraint, DISPOSABLE_EMAIL_DOMAINS } from './is-valid-email.decorator';
import * as dns from 'dns/promises';

jest.mock('dns/promises');

describe('IsValidEmailConstraint', () => {
  let validator: IsValidEmailConstraint;

  beforeEach(() => {
    validator = new IsValidEmailConstraint();
    jest.clearAllMocks();
  });

  it('should reject non-string values', async () => {
    expect(await validator.validate(null)).toBe(false);
    expect(await validator.validate(12345)).toBe(false);
    expect(await validator.validate({})).toBe(false);
    expect(await validator.validate(undefined)).toBe(false);
  });

  it('should reject malformed email addresses', async () => {
    expect(await validator.validate('notanemail')).toBe(false);
    expect(await validator.validate('test@')).toBe(false);
    expect(await validator.validate('@gmail.com')).toBe(false);
    expect(await validator.validate('test@.com')).toBe(false);
  });

  it('should reject usernames shorter than 2 characters', async () => {
    expect(await validator.validate('a@gmail.com')).toBe(false);
  });

  it('should reject disposable and temporary email domains', async () => {
    for (const domain of ['mailinator.com', 'tempmail.com', 'yopmail.com', 'sharklasers.com', '10minutemail.com']) {
      expect(await validator.validate(`user123@${domain}`)).toBe(false);
    }
  });

  it('should reject suspicious dummy patterns like abc@x.com', async () => {
    expect(await validator.validate('abc@x.com')).toBe(false);
    expect(await validator.validate('test@x.com')).toBe(false);
    expect(await validator.validate('fake@a.io')).toBe(false);
    expect(await validator.validate('dummy@z.co')).toBe(false);
  });

  it('should pass valid emails during test mode', async () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'test';

    expect(await validator.validate('john.doe@company.org')).toBe(true);
    expect(await validator.validate('farzad@mehrchain.com')).toBe(true);

    process.env['NODE_ENV'] = originalEnv;
  });

  it('should verify MX and A records in non-test mode when DNS returns records', async () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';

    (dns.resolveMx as jest.Mock).mockResolvedValue([{ exchange: 'mail.company.com', priority: 10 }]);

    const result = await validator.validate('developer@company.com');
    expect(result).toBe(true);
    expect(dns.resolveMx).toHaveBeenCalledWith('company.com');

    process.env['NODE_ENV'] = originalEnv;
  });

  it('should reject domain if MX and A records do not exist or throw error', async () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';

    (dns.resolveMx as jest.Mock).mockRejectedValue(new Error('ENOTFOUND'));
    (dns.resolve4 as jest.Mock).mockRejectedValue(new Error('ENOTFOUND'));

    const result = await validator.validate('user@nonexistentdomain999888777.com');
    expect(result).toBe(false);

    process.env['NODE_ENV'] = originalEnv;
  });

  it('should provide default error message', () => {
    expect(validator.defaultMessage()).toContain('email address is invalid, disposable');
  });
});
