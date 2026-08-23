import { LoginUseCase } from './login.usecase';
import { UserRepositoryPort } from 'src/modules/users/repositories/user-repository.port';
import { SessionRepository } from 'src/modules/sessions/repositories/session.repository';
import { PasswordHasherStrategy } from 'src/common/secret/hashing/password-hasher.strategy';
import { AuthTokenFactory } from '../factories/auth-token.factory';
import { AuthError } from '../constants/auth.errors';
import { Role, Status } from 'src/generated/prisma/client';

describe('LoginUseCase', () => {
  const baseUser = {
    id: 1,
    email: 'admin@example.com',
    passwordHash: 'hashed',
    status: Status.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function makeUseCase(overrides: {
    userRepository?: Partial<UserRepositoryPort>;
    passwordCorrect?: boolean;
  }) {
    const userRepository: Partial<UserRepositoryPort> = {
      findByEmail: jest.fn().mockResolvedValue(baseUser),
      ...overrides.userRepository,
    };
    const sessionRepository: Partial<SessionRepository> = {
      revokeAllActiveByUserId: jest.fn(),
      create: jest.fn(),
    };
    const passwordHasherStrategy: Partial<PasswordHasherStrategy> = {
      compare: jest.fn().mockResolvedValue(overrides.passwordCorrect ?? true),
      hash: jest.fn().mockResolvedValue('hashed-refresh-token'),
    };
    const authTokenFactory: Partial<AuthTokenFactory> = {
      createLoginResponse: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 1, email: baseUser.email },
      }),
    };

    const useCase = new LoginUseCase(
      userRepository as UserRepositoryPort,
      sessionRepository as SessionRepository,
      passwordHasherStrategy as PasswordHasherStrategy,
      authTokenFactory as AuthTokenFactory,
    );

    return { useCase, userRepository, sessionRepository };
  }

  it('allows an ADMIN with correct credentials to log in', async () => {
    const { useCase } = makeUseCase({
      userRepository: {
        findByEmail: jest
          .fn()
          .mockResolvedValue({ ...baseUser, role: Role.ADMIN }),
      },
    });

    const result = await useCase.excutive({
      email: baseUser.email,
      password: 'correct-password',
    });

    expect(result.accessToken).toBe('access-token');
  });

  it('allows a USER with correct credentials to log in (email/password is open to all roles again)', async () => {
    const { useCase } = makeUseCase({
      userRepository: {
        findByEmail: jest
          .fn()
          .mockResolvedValue({ ...baseUser, role: Role.USER }),
      },
    });

    const result = await useCase.excutive({
      email: baseUser.email,
      password: 'correct-password',
    });

    expect(result.accessToken).toBe('access-token');
  });

  it('rejects a BANNED user regardless of role', async () => {
    const { useCase } = makeUseCase({
      userRepository: {
        findByEmail: jest.fn().mockResolvedValue({
          ...baseUser,
          role: Role.ADMIN,
          status: Status.BANNED,
        }),
      },
    });

    await expect(
      useCase.excutive({ email: baseUser.email, password: 'whatever' }),
    ).rejects.toMatchObject({ message: AuthError.USER_BANNED.message });
  });

  it('rejects unknown email or wrong password with a generic error', async () => {
    const { useCase } = makeUseCase({
      userRepository: { findByEmail: jest.fn().mockResolvedValue(null) },
    });

    await expect(
      useCase.excutive({ email: 'nobody@example.com', password: 'x' }),
    ).rejects.toMatchObject({
      message: AuthError.INVALID_CREDENTIALS.message,
    });
  });
});
