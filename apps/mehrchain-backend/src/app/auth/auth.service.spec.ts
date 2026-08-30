import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn(() => 'mocked_jwt_token_123'),
  };

  beforeEach(() => {
    service = new AuthService(mockPrisma as any, mockJwt as any);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register user and return accessToken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Farzad',
        email: 'farzad@example.com',
        role: 'USER',
        createdAt: new Date(),
      });

      const result = await service.register({
        name: 'Farzad',
        email: 'farzad@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('farzad@example.com');
      expect(result.accessToken).toBe('mocked_jwt_token_123');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.register({
          name: 'Farzad',
          email: 'duplicate@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Farzad',
        email: 'farzad@example.com',
        passwordHash,
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
});
