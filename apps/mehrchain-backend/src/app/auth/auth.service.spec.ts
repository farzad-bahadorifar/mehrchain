import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn(() => 'mocked_jwt_token_123'),
  };

  const mockMailService = {
    generateOtpCode: jest.fn(() => '123456'),
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    service = new AuthService(mockPrisma as any, mockJwt as any, mockMailService as any);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully create unverified user and send OTP code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Farzad',
        email: 'farzad@example.com',
        isEmailVerified: false,
        verificationCode: '123456',
        role: 'USER',
        createdAt: new Date(),
      });

      const result = await service.register({
        name: 'Farzad',
        email: 'farzad@example.com',
        password: 'password123',
      });

      expect(result.requiresVerification).toBe(true);
      expect(result.email).toBe('farzad@example.com');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        'farzad@example.com',
        'Farzad',
        '123456',
      );
    });

    it('should throw ConflictException if email is already verified and registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id', isEmailVerified: true });

      await expect(
        service.register({
          name: 'Farzad',
          email: 'duplicate@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should refresh OTP and update existing unverified user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id', isEmailVerified: false });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register({
        name: 'Farzad',
        email: 'unverified@example.com',
        password: 'newpassword123',
      });

      expect(result.requiresVerification).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should verify user when code is valid and not expired', async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Farzad',
        email: 'farzad@example.com',
        isEmailVerified: false,
        verificationCode: '123456',
        verificationCodeExpiresAt: futureDate,
        role: 'USER',
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        name: 'Farzad',
        email: 'farzad@example.com',
        role: 'USER',
        isEmailVerified: true,
        createdAt: new Date(),
      });

      const result = await service.verifyEmail({
        email: 'farzad@example.com',
        code: '123456',
      });

      expect(result.user.email).toBe('farzad@example.com');
      expect(result.accessToken).toBe('mocked_jwt_token_123');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if verification code is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'farzad@example.com',
        isEmailVerified: false,
        verificationCode: '654321',
        verificationCodeExpiresAt: new Date(Date.now() + 10000),
      });

      await expect(
        service.verifyEmail({
          email: 'farzad@example.com',
          code: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if code has expired', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'farzad@example.com',
        isEmailVerified: false,
        verificationCode: '123456',
        verificationCodeExpiresAt: new Date(Date.now() - 10000),
      });

      await expect(
        service.verifyEmail({
          email: 'farzad@example.com',
          code: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerificationCode', () => {
    it('should generate and send new OTP if user is unverified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Farzad',
        email: 'farzad@example.com',
        isEmailVerified: false,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.resendVerificationCode({ email: 'farzad@example.com' });
      expect(result.success).toBe(true);
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        'farzad@example.com',
        'Farzad',
        '123456',
      );
    });

    it('should throw BadRequestException if email is already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'farzad@example.com',
        isEmailVerified: true,
      });

      await expect(
        service.resendVerificationCode({ email: 'farzad@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials and verified email', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Farzad',
        email: 'farzad@example.com',
        passwordHash,
        isEmailVerified: true,
        role: 'USER',
        createdAt: new Date(),
      });

      const result = await service.login({
        email: 'farzad@example.com',
        password: 'password123',
      });

      expect(result.user.id).toBe('user-uuid-1');
      expect(result.accessToken).toBe('mocked_jwt_token_123');
    });

    it('should throw UnauthorizedException if email is unverified', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Farzad',
        email: 'farzad@example.com',
        passwordHash,
        isEmailVerified: false,
        role: 'USER',
      });

      await expect(
        service.login({
          email: 'farzad@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const passwordHash = await bcrypt.hash('correctPassword', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'farzad@example.com',
        passwordHash,
        isEmailVerified: true,
      });

      await expect(
        service.login({
          email: 'farzad@example.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('should return user profile if found', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Farzad',
        email: 'farzad@example.com',
        role: 'USER',
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('user-unknown')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user and return success message', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'farzad@example.com' });
      mockPrisma.user.delete = jest.fn().mockResolvedValue({ id: 'user-1' });

      const result = await service.deleteAccount('user-1');
      expect(result.success).toBe(true);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('should throw UnauthorizedException if user does not exist when deleting', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('nonexistent-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});
