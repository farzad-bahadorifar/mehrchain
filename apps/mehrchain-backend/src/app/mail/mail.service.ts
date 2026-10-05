import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { randomInt } from 'node:crypto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Generates a random 6-digit numeric verification code.
   */
  generateOtpCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  /**
   * Sends an email containing the 6-digit verification code.
   * Dispatches via Resend API if RESEND_API_KEY is present,
   * or falls back to structured console logging for dev/testing.
   *
   * @param email - Recipient email address
   * @param name - Recipient display name
   * @param code - 6-digit OTP code
   */
  async sendVerificationEmail(email: string, name: string, code: string): Promise<boolean> {
    const resendApiKey = process.env['RESEND_API_KEY'];
    const fromAddress =
      process.env['MAIL_FROM'] || process.env['SMTP_FROM'] || 'MehrChain <onboarding@resend.dev>';
    const recipientName = name || 'Friend';

    // HTML Email Template (English & Branded Dark Theme)
    const htmlContent = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MehrChain Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 24px; direction: ltr; text-align: left; }
    .container { max-width: 520px; margin: 0 auto; background-color: #161b22; border-radius: 20px; border: 1px solid #30363d; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 26px; font-weight: 800; color: #14b8a6; letter-spacing: -0.5px; }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 8px; margin-bottom: 8px; }
    .description { font-size: 14px; color: #8b949e; line-height: 1.6; margin-bottom: 24px; }
    .otp-box { background: linear-gradient(135deg, rgba(13,148,136,0.15), rgba(245,158,11,0.15)); border: 2px dashed #0d9488; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #2dd4bf; letter-spacing: 8px; margin: 0; }
    .expiry { font-size: 12px; color: #f59e0b; margin-top: 8px; }
    .footer { font-size: 12px; color: #484f58; text-align: center; margin-top: 32px; border-top: 1px solid #21262d; padding-top: 16px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MehrChain</div>
      <h1 class="title">Verification Code</h1>
    </div>
    <p class="description">
      Hello <strong>${recipientName}</strong>,<br>
      Please enter the 6-digit code below in the app to verify your email and continue your journey:
    </p>
    <div class="otp-box">
      <div class="otp-code">${code}</div>
      <div class="expiry">Valid for 15 minutes</div>
    </div>
    <p class="description" style="font-size: 12px; color: #8b949e;">
      If you did not request this verification code, you can safely ignore this email. Never share this code with anyone.
    </p>
    <div class="footer">
      This is an automated message from MehrChain.<br>
      MehrChain — Small Acts. Big Change.
    </div>
  </div>
</body>
</html>
    `.trim();

    const textContent = `Hello ${recipientName},\n\nYour MehrChain verification code is: ${code}\nThis code is valid for 15 minutes.\n\nMehrChain — Small Acts. Big Change.`;

    // 1. Dispatch via Resend REST API if API Key is configured
    if (resendApiKey) {
      try {
        this.logger.log(`Dispatching verification email to ${email} via Resend API...`);
        const response = await axios.post(
          'https://api.resend.com/emails',
          {
            from: fromAddress,
            to: [email],
            subject: `Your MehrChain verification code: ${code}`,
            html: htmlContent,
            text: textContent,
          },
          {
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        );

        this.logger.log(
          `Email dispatched successfully via Resend. ID: ${response.data?.id || 'ok'}`,
        );
        return true;
      } catch (err: any) {
        this.logger.error(
          `Verification email delivery failed (status ${err?.response?.status || 'unavailable'}).`,
        );
        // Fallback to console logging below so user is not completely blocked
      }
    }

    if (process.env['NODE_ENV'] === 'production') {
      throw new ServiceUnavailableException(
        'Verification email could not be sent. Please retry later.',
      );
    }

    // 2. Structured console logging (Fallback for local dev, tests, or missing API key)
    this.logger.log(
      `\n======================================================\n📨 [EMAIL VERIFICATION OTP]\nTo: ${name} <${email}>\nVerification Code: [ ${code} ]\nValid For: 15 minutes\n======================================================\n`,
    );

    return true;
  }
}
