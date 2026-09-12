import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Registers a new user account, generates an OTP verification code, and sends verification email.
   *
   * @param dto - User registration payload containing name, email, and password.
   * @returns Object indicating verification is required.
   * @throws {ConflictException} If the email is already registered and verified.
   */
  async register(dto: RegisterDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanName = dto.name.trim();

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing && existing.isEmailVerified) {
      throw new ConflictException('This email is already registered.');
    }

    // Generate 6-digit OTP and 15-minute expiration
    const otpCode = this.mailService.generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    if (existing && !existing.isEmailVerified) {
      // User registered earlier but never verified -> refresh OTP & password
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          passwordHash,
          verificationCode: otpCode,
          verificationCodeExpiresAt: expiresAt,
        },
      });
    } else {
      // Create fresh unverified user record
      await this.prisma.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          isEmailVerified: false,
          verificationCode: otpCode,
          verificationCodeExpiresAt: expiresAt,
        },
      });
    }

    // Send email with OTP code
    await this.mailService.sendVerificationEmail(cleanEmail, cleanName, otpCode);

    return {
      requiresVerification: true,
      email: cleanEmail,
      message: 'Verification code sent to your email address.',
    };
  }

  /**
   * Verifies the 6-digit OTP code sent to user email and activates the account.
   *
   * @param dto - Verification payload containing email and 6-digit code.
   * @returns Authenticated user profile and session JWT token.
   * @throws {BadRequestException | UnauthorizedException} If code is invalid or expired.
   */
  async verifyEmail(dto: VerifyEmailDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const code = dto.code.trim();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }

    if (user.isEmailVerified) {
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        accessToken,
      };
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code.');
    }

    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    // Mark user as verified and clear temporary token
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const accessToken = this.jwtService.sign({
      sub: updatedUser.id,
      email: updatedUser.email,
    });

    return {
      user: updatedUser,
      accessToken,
    };
  }

  /**
   * Resends a new 6-digit verification code to the user email.
   *
   * @param dto - Resend verification payload containing email.
   * @returns Success confirmation.
   */
  async resendVerificationCode(dto: ResendVerificationDto) {
    const cleanEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email address is already verified. Please sign in.');
    }

    const otpCode = this.mailService.generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: otpCode,
        verificationCodeExpiresAt: expiresAt,
      },
    });

    await this.mailService.sendVerificationEmail(cleanEmail, user.name, otpCode);

    return {
      success: true,
      message: 'A new verification code has been sent to your email.',
    };
  }

  /**
   * Authenticates user credentials and returns a signed JWT session token.
   *
   * @param dto - Login credentials containing email and plaintext password.
   * @returns Object containing the authenticated user profile and the signed JWT accessToken.
   * @throws {UnauthorizedException} If credentials do not match or email is unverified.
   */
  async login(dto: LoginDto) {
    const cleanEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new UnauthorizedException('No account found with this email. Please sign up.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Your email address is not verified yet. Please enter the verification code sent to your inbox.',
      );
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return user;
  }

  /**
   * Permanently hard-deletes user account and cascades all associated commitments and logs.
   *
   * @param userId - ID of the authenticated user to delete.
   * @returns Success status and confirmation message.
   * @throws {UnauthorizedException} If user record is not found.
   */
  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      success: true,
      message: 'User account and all associated habit data have been permanently deleted.',
    };
  }
}
