import { LinkGoogleAccountUseCase } from './link-google-account.usecase';
import { UserRepositoryPort } from 'src/modules/users/repositories/user-repository.port';
import { AuthError } from '../constants/auth.errors';
import { Role, Status } from 'src/generated/prisma/client';

describe('LinkGoogleAccountUseCase', () => {
  const currentUser = {
    id: 1,
    email: 'student@example.com',
    googleId: null,
    name: null,
    picture: null,
    role: Role.USER,
    status: Status.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const profile = {
    googleId: 'google-123',
    email: 'student@gmail.com',
    name: 'Student Name',
    picture: 'https://example.com/avatar.png',
  };

  function makeUseCase(overrides: Partial<UserRepositoryPort> = {}) {
    const userRepository: Partial<UserRepositoryPort> = {
      findByGoogleId: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(currentUser),
      updateUser: jest
        .fn()
        .mockResolvedValue({ ...currentUser, googleId: profile.googleId }),
      ...overrides,
    };
    const useCase = new LinkGoogleAccountUseCase(
      userRepository as UserRepositoryPort,
    );
    return { useCase, userRepository };
  }

  it('links the Google identity onto the current user account', async () => {
    const { useCase, userRepository } = makeUseCase();

    const result = await useCase.execute(1, profile);

    expect(userRepository.updateUser).toHaveBeenCalledWith(1, {
      googleId: profile.googleId,
      name: profile.name,
      picture: profile.picture,
    });
    expect(result.id).toBe(1);
  });

  it('rejects when this Google account is already linked to a different user', async () => {
    const { useCase } = makeUseCase({
      findByGoogleId: jest.fn().mockResolvedValue({ ...currentUser, id: 2 }),
    });

    await expect(useCase.execute(1, profile)).rejects.toMatchObject({
      message: AuthError.GOOGLE_ALREADY_LINKED_TO_ANOTHER_ACCOUNT.message,
    });
  });

  it('rejects when the current user already has a different Google account linked', async () => {
    const { useCase } = makeUseCase({
      findOne: jest
        .fn()
        .mockResolvedValue({ ...currentUser, googleId: 'other-google-id' }),
    });

    await expect(useCase.execute(1, profile)).rejects.toMatchObject({
      message: AuthError.GOOGLE_ACCOUNT_MISMATCH.message,
    });
  });

  it('is idempotent when re-linking the same already-linked Google account', async () => {
    const { useCase, userRepository } = makeUseCase({
      findByGoogleId: jest
        .fn()
        .mockResolvedValue({ ...currentUser, googleId: profile.googleId }),
      findOne: jest
        .fn()
        .mockResolvedValue({ ...currentUser, googleId: profile.googleId }),
    });

    await expect(useCase.execute(1, profile)).resolves.toBeDefined();
    expect(userRepository.updateUser).toHaveBeenCalled();
  });
});
