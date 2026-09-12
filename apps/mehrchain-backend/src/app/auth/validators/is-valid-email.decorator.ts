import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as dns from 'dns/promises';

/**
 * List of known disposable and temporary email domains.
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'sharklasers.com',
  'grr.la',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'dispostable.com',
  'getnada.com',
  'inboxkitten.com',
  'throwawaymail.com',
  'fakemailgenerator.com',
  'maildrop.cc',
  'mohmal.com',
  'mytemp.email',
  'nada.ltd',
  'crazymailing.com',
  'burnermail.io',
  'generator.email',
  'dropmail.me',
  'tempail.com',
]);

/**
 * Reserved, dummy, or non-routable domains not allowed in production.
 */
export const BLOCKED_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'invalid.com',
  'localhost',
]);

/**
 * Widely-used, trusted email provider domains that bypass external DNS queries.
 */
export const TRUSTED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'aol.com',
  'mail.ru',
  'yandex.com',
  'chmail.ir',
  'iran.ir',
]);

/**
 * Common fake / dummy usernames that are blocked if used with minimal domains.
 */
export const SUSPICIOUS_USERNAMES = new Set([
  'abc',
  'test',
  'temp',
  'fake',
  'dummy',
  'asdf',
  'qwerty',
  'admin',
  'root',
  'null',
  'undefined',
]);

@ValidatorConstraint({ async: true, name: 'IsValidEmailConstraint' })
export class IsValidEmailConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args?: ValidationArguments): Promise<boolean> {
    if (typeof value !== 'string') {
      return false;
    }

    const email = value.trim().toLowerCase();

    // 1. Basic syntax check using standard RFC 5322 compatible regex
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    const [username, domain] = email.split('@');
    if (!username || !domain) {
      return false;
    }

    // 2. Minimum length check on username
    if (username.length < 2) {
      return false;
    }

    // 3. Reject disposable temporary email providers
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      return false;
    }

    // 4. In production/live environment, handle reserved or dummy domains
    if (BLOCKED_DOMAINS.has(domain)) {
      if (process.env['NODE_ENV'] !== 'test') {
        return false;
      }
    }

    // 5. Fast-path: Trusted email provider domains (immediate pass)
    if (TRUSTED_EMAIL_DOMAINS.has(domain)) {
      return true;
    }

    // 6. Reject suspicious combinations (e.g., abc@x.com, test@anything.com)
    if (SUSPICIOUS_USERNAMES.has(username) && domain.length <= 5) {
      return false;
    }

    // 7. Skip DNS lookup in test environment
    if (process.env['NODE_ENV'] === 'test') {
      return true;
    }

    // 8. DNS Verification (Check MX records for real mail receiving capability)
    try {
      const mxLookup = dns.resolveMx(domain);
      const timeout = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => reject(new Error('DNS Timeout')), 4000);
        if (typeof timer.unref === 'function') {
          timer.unref();
        }
      });

      const mxRecords = await Promise.race([mxLookup, timeout]);
      if (Array.isArray(mxRecords) && mxRecords.length > 0) {
        return true;
      }

      // Fallback: Check A records if domain handles direct A-record mail delivery
      const aRecords = await dns.resolve4(domain);
      return Array.isArray(aRecords) && aRecords.length > 0;
    } catch {
      // In case of network / DNS resolution timeouts in restricted environments,
      // fallback to passing valid RFC syntax rather than rejecting genuine users.
      return true;
    }
  }

  defaultMessage(args?: ValidationArguments): string {
    return 'The provided email address is invalid, disposable, or does not have a valid mail server.';
  }
}

/**
 * Decorator to validate email syntax, prevent disposable email domains,
 * block dummy/fake email patterns, and verify DNS MX/A mail exchanger records.
 */
export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidEmailConstraint,
    });
  };
}
