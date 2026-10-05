import axios from 'axios';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
        username: 'farzad',
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
          username: 'farzad',
          name: 'Farzad',
          email: 'duplicate@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should refresh OTP and update existing unverified user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'unverified@example.com',
        isEmailVerified: false,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register({
        username: 'farzad',
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

      await expect(service.resendVerificationCode({ email: 'farzad@example.com' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials and verified email', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      mockPrisma.user.findFirst.mockResolvedValue({
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
      mockPrisma.user.findFirst.mockResolvedValue({
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
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const passwordHash = await bcrypt.hash('correctPassword', 10);
      mockPrisma.user.findFirst.mockResolvedValue({
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

  describe('googleLogin', () => {
    it('should log in existing user with mock token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'google-user-1',
        name: 'Google User',
        email: 'tester@gmail.com',
        username: 'tester',
        isEmailVerified: true,
        role: 'USER',
        createdAt: new Date(),
      });

      const result = await service.googleLogin({ idToken: 'mock_google_tester@gmail.com' });
      expect(result.user.email).toBe('tester@gmail.com');
      expect(result.accessToken).toBe('mocked_jwt_token_123');
    });

    it('should create new verified user for first-time Google login', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // user by email
        .mockResolvedValueOnce(null); // username check

      mockPrisma.user.create.mockResolvedValue({
        id: 'new-google-user-id',
        name: 'Google User',
        email: 'newuser@gmail.com',
        username: 'newuser',
        isEmailVerified: true,
        role: 'USER',
        createdAt: new Date(),
      });

      const result = await service.googleLogin({ idToken: 'mock_google_newuser@gmail.com' });
      expect(result.user.email).toBe('newuser@gmail.com');
      expect(mockPrisma.user.create).toHaveBeenCalled();
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

  describe('production authentication regressions', () => {
    let originalNodeEnv: string | undefined;
    beforeEach(() => {
      originalNodeEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';
    });
    afterEach(() => {
      if (originalNodeEnv === undefined) delete process.env['NODE_ENV'];
      else process.env['NODE_ENV'] = originalNodeEnv;
    });
    it('rejects mock Google tokens before touching the database', async () => {
      await expect(
        service.googleLogin({ idToken: 'mock_google_victim@gmail.com' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
    it('never authenticates a verified user with an arbitrary OTP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'victim', isEmailVerified: true });
      await expect(
        service.verifyEmail({ email: 'victim@example.com', code: '000000' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
    it('does not disclose the registration OTP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'new' });
      const result = await service.register({
        username: 'new_user',
        email: 'new@example.com',
        password: 'password123',
      });
      expect(result).not.toHaveProperty('previewCode');
    });
    it('does not overwrite an unverified username owned by another email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'other',
        email: 'other@example.com',
        isEmailVerified: false,
      });
      await expect(
        service.register({
          username: 'taken',
          email: 'attacker@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  it.each([
    { aud: 'different-client' },
    { iss: 'https://attacker.example' },
    { exp: '1' },
    { email_verified: 'false' },
  ])('rejects invalid Google claims %j without creating a user', async (invalid) => {
    const previous = process.env['GOOGLE_CLIENT_ID'];
    process.env['GOOGLE_CLIENT_ID'] = 'real-web-client';
    const spy = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({
        data: {
          email: 'real@example.com',
          email_verified: 'true',
          aud: 'real-web-client',
          iss: 'https://accounts.google.com',
          sub: 'google-id',
          exp: String(Math.floor(Date.now() / 1000) + 300),
          ...invalid,
        },
      });
    try {
      await expect(service.googleLogin({ idToken: 'real-signed-token' })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockJwt.sign).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      if (previous === undefined) delete process.env['GOOGLE_CLIENT_ID'];
      else process.env['GOOGLE_CLIENT_ID'] = previous;
    }
  });
  it('keeps the same database identity for repeated verified Google sign-ins', async () => {
    const previous = process.env['GOOGLE_CLIENT_ID'];
    process.env['GOOGLE_CLIENT_ID'] = 'real-web-client';
    const spy = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({
        data: {
          email: 'real@example.com',
          email_verified: 'true',
          aud: 'real-web-client',
          iss: 'https://accounts.google.com',
          sub: 'google-id',
          exp: String(Math.floor(Date.now() / 1000) + 300),
        },
      });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'stable-id',
      email: 'real@example.com',
      username: 'real',
      isEmailVerified: true,
    });
    try {
      const first = await service.googleLogin({ idToken: 'signed-token' });
      const second = await service.googleLogin({ idToken: 'signed-token' });
      expect(first.user.id).toBe(second.user.id);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      if (previous === undefined) delete process.env['GOOGLE_CLIENT_ID'];
      else process.env['GOOGLE_CLIENT_ID'] = previous;
    }
  });
});
