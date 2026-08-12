import { Test, TestingModule } from '@nestjs/testing';
import { GoogleLoginUseCase } from './google-login.usecase';
import { UserRepositoryPort } from '../repositories/user-repository.port';
import { SessionRepository } from '../sessions/repositories/session.repository';
import { AuthTokenFactory } from '../factories/auth-token.factory';
import { PasswordHasherStrategy } from 'src/common/secret/hashing/password-hasher.strategy';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { Role, Status, SessionStatus } from 'src/generated/prisma/client';

describe('GoogleLoginUseCase', () => {
  let useCase: GoogleLoginUseCase;
  let mockUserRepository: Partial<UserRepositoryPort>;
  let mockSessionRepository: Partial<SessionRepository>;
  let mockAuthTokenFactory: Partial<AuthTokenFactory>;
  let mockPasswordHasherStrategy: Partial<PasswordHasherStrategy>;

  const mockGoogleUser = {
    googleId: 'google-123',
    email: 'test@gmail.com',
    name: 'Test User',
    picture: 'https://example.com/photo.jpg',
  };

  const mockUser = {
    id: 1,
    email: 'test@gmail.com',
    googleId: 'google-123',
    passwordHash: null,
    role: Role.USER,
    status: Status.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 1,
      email: 'test@gmail.com',
      role: Role.USER,
      status: Status.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    mockUserRepository = {
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
    };

    mockSessionRepository = {
      revokeAllActiveByUserId: jest.fn(),
      create: jest.fn(),
    };

    mockAuthTokenFactory = {
      createLoginResponse: jest.fn(),
    };

    mockPasswordHasherStrategy = {
      hash: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleLoginUseCase,
        { provide: UserRepositoryPort, useValue: mockUserRepository },
        { provide: SessionRepository, useValue: mockSessionRepository },
        { provide: AuthTokenFactory, useValue: mockAuthTokenFactory },
        {
          provide: PasswordHasherStrategy,
          useValue: mockPasswordHasherStrategy,
        },
      ],
    }).compile();

    useCase = module.get<GoogleLoginUseCase>(GoogleLoginUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should login existing user with googleId', async () => {
      (mockUserRepository.findByGoogleId as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (mockAuthTokenFactory.createLoginResponse as jest.Mock).mockResolvedValue(
        mockLoginResponse,
      );
      (mockPasswordHasherStrategy.hash as jest.Mock).mockResolvedValue(
        'hashed-refresh-token',
      );

      const result = await useCase.execute(mockGoogleUser);

      expect(mockUserRepository.findByGoogleId).toHaveBeenCalledWith(
        'google-123',
      );
      expect(
        mockSessionRepository.revokeAllActiveByUserId,
      ).toHaveBeenCalledWith(1);
      expect(mockAuthTokenFactory.createLoginResponse).toHaveBeenCalledWith(
        mockUser,
      );
      expect(mockPasswordHasherStrategy.hash).toHaveBeenCalledWith(
        'refresh-token',
      );
      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        userID: 1,
        refreshTokenHash: 'hashed-refresh-token',
        status: SessionStatus.ACTIVE,
      });
      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw USER_BANNED when existing user with googleId is banned', async () => {
      const bannedUser = { ...mockUser, status: Status.BANNED };
      (mockUserRepository.findByGoogleId as jest.Mock).mockResolvedValue(
        bannedUser,
      );

      await expect(useCase.execute(mockGoogleUser)).rejects.toThrow(
        AppException,
      );
      await expect(useCase.execute(mockGoogleUser)).rejects.toMatchObject({
        error: AuthError.USER_BANNED,
      });
    });

    it('should link googleId to existing user by email', async () => {
      const userWithoutGoogleId = { ...mockUser, googleId: null };
      const updatedUser = { ...mockUser, googleId: 'google-123' };

      (mockUserRepository.findByGoogleId as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        userWithoutGoogleId,
      );
      (mockUserRepository.updateUser as jest.Mock).mockResolvedValue(
        updatedUser,
      );
      (mockAuthTokenFactory.createLoginResponse as jest.Mock).mockResolvedValue(
        mockLoginResponse,
      );
      (mockPasswordHasherStrategy.hash as jest.Mock).mockResolvedValue(
        'hashed-refresh-token',
      );

      const result = await useCase.execute(mockGoogleUser);

      expect(mockUserRepository.findByGoogleId).toHaveBeenCalledWith(
        'google-123',
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@gmail.com',
      );
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, {
        googleId: 'google-123',
      });
      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw USER_BANNED when existing user by email is banned', async () => {
      const bannedUser = { ...mockUser, googleId: null, status: Status.BANNED };
      (mockUserRepository.findByGoogleId as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        bannedUser,
      );

      await expect(useCase.execute(mockGoogleUser)).rejects.toThrow(
        AppException,
      );
      await expect(useCase.execute(mockGoogleUser)).rejects.toMatchObject({
        error: AuthError.USER_BANNED,
      });
    });

    it('should create new user when no existing user found', async () => {
      const newUser = { ...mockUser, id: 2 };
      (mockUserRepository.findByGoogleId as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(newUser);
      (mockAuthTokenFactory.createLoginResponse as jest.Mock).mockResolvedValue(
        mockLoginResponse,
      );
      (mockPasswordHasherStrategy.hash as jest.Mock).mockResolvedValue(
        'hashed-refresh-token',
      );

      const result = await useCase.execute(mockGoogleUser);

      expect(mockUserRepository.findByGoogleId).toHaveBeenCalledWith(
        'google-123',
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@gmail.com',
      );
      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        googleId: 'google-123',
        passwordHash: null,
      });
      expect(result).toEqual(mockLoginResponse);
    });
  });
});
