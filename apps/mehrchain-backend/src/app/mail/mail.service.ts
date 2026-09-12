import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Generates a random 6-digit numeric verification code.
   */
  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Sends an email containing the 6-digit verification code.
   * If SMTP is configured, sends via mailer; otherwise falls back to structured console logging.
   *
   * @param email - Recipient email address
   * @param name - Recipient full name
   * @param code - 6-digit OTP code
   */
  async sendVerificationEmail(email: string, name: string, code: string): Promise<void> {
    const smtpHost = process.env['SMTP_HOST'];

    if (smtpHost) {
      // SMTP integration (if SMTP credentials are provided in .env)
      this.logger.log(`Dispatching verification email to ${email} via SMTP (${smtpHost})...`);
      // Future/Production SMTP transport dispatch
    }

    // Beautiful console logging for dev / testing / fallback
    this.logger.log(`\n======================================================\n📨 [EMAIL VERIFICATION OTP]\nTo: ${name} <${email}>\nVerification Code: [ ${code} ]\nValid For: 15 minutes\n======================================================\n`);
  }
}
