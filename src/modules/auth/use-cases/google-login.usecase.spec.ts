import { Test, TestingModule } from '@nestjs/testing';
import { GoogleLoginUseCase } from './google-login.usecase';
import { UserRepositoryPort } from 'src/modules/users/repositories/user-repository.port';
import { SessionRepository } from 'src/modules/sessions/repositories/session.repository';
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
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
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
    it('should login existing user with matching googleId', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockAuthTokenFactory.createLoginResponse as jest.Mock).mockResolvedValue(
        mockLoginResponse,
      );
      (mockPasswordHasherStrategy.hash as jest.Mock).mockResolvedValue(
        'hashed-refresh-token',
      );

      const result = await useCase.execute(mockGoogleUser);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@gmail.com',
      );
      expect(
        mockSessionRepository.revokeAllActiveByUserId,
      ).toHaveBeenCalledWith(1);
      expect(mockAuthTokenFactory.createLoginResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          email: 'test@gmail.com',
          role: Role.USER,
          status: Status.ACTIVE,
        }),
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

    it('should throw GOOGLE_ACCOUNT_MISMATCH when googleId differs', async () => {
      const mismatchedUser = { ...mockUser, googleId: 'different-google-id' };
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        mismatchedUser,
      );

      await expect(useCase.execute(mockGoogleUser)).rejects.toThrow(
        AppException,
      );
      await expect(useCase.execute(mockGoogleUser)).rejects.toMatchObject({
        message: AuthError.GOOGLE_ACCOUNT_MISMATCH.message,
      });
    });

    it('should throw USER_BANNED when existing user is banned', async () => {
      const bannedUser = { ...mockUser, status: Status.BANNED };
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        bannedUser,
      );

      await expect(useCase.execute(mockGoogleUser)).rejects.toThrow(
        AppException,
      );
      await expect(useCase.execute(mockGoogleUser)).rejects.toMatchObject({
        message: AuthError.USER_BANNED.message,
      });
    });

    it('should link googleId to existing user by email', async () => {
      const userWithoutGoogleId = { ...mockUser, googleId: null };
      const updatedUser = { ...mockUser, googleId: 'google-123' };

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

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@gmail.com',
      );
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, {
        googleId: 'google-123',
      });
      expect(result).toEqual(mockLoginResponse);
    });

    it('should create new user when no existing user found', async () => {
      const newUser = { ...mockUser, id: 2 };
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(newUser);
      (mockAuthTokenFactory.createLoginResponse as jest.Mock).mockResolvedValue(
        mockLoginResponse,
      );
      (mockPasswordHasherStrategy.hash as jest.Mock).mockResolvedValue(
        'hashed-refresh-token',
      );

      const result = await useCase.execute(mockGoogleUser);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@gmail.com',
      );
      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        googleId: 'google-123',
        passwordHash: null,
      });
      expect(
        mockSessionRepository.revokeAllActiveByUserId,
      ).toHaveBeenCalledWith(2);
      expect(result).toEqual(mockLoginResponse);
    });
  });
});
