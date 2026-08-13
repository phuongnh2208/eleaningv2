import { Injectable } from '@nestjs/common';
import { Status, SessionStatus } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { PasswordHasherStrategy } from 'src/common/secret/hashing/password-hasher.strategy';
import { UserRepositoryPort } from 'src/modules/users/repositories/user-repository.port';
import { SessionRepository } from 'src/modules/sessions/repositories/session.repository';
import { AuthError } from '../constants/auth.errors';
import { AuthTokenFactory } from '../factories/auth-token.factory';

export type GoogleProfile = {
  googleId: string;
  email: string;
};

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
    private readonly authTokenFactory: AuthTokenFactory,
  ) {}

  async execute(profile: GoogleProfile) {
    let user = await this.userRepository.findByEmail(profile.email);

    if (user?.googleId && user.googleId !== profile.googleId) {
      throw new AppException(AuthError.GOOGLE_ACCOUNT_MISMATCH);
    }

    if (user && user.status !== Status.ACTIVE) {
      throw new AppException(AuthError.USER_BANNED);
    }

    if (!user) {
      user = await this.userRepository.createUser({
        email: profile.email,
        passwordHash: null,
        googleId: profile.googleId,
      });
    } else if (!user.googleId) {
      user = await this.userRepository.updateUser(user.id, {
        googleId: profile.googleId,
      });
    }

    await this.sessionRepository.revokeAllActiveByUserId(user.id);

    const loginResponse = await this.authTokenFactory.createLoginResponse({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    const refreshTokenHash = await this.passwordHasherStrategy.hash(
      loginResponse.refreshToken,
    );

    await this.sessionRepository.create({
      userID: user.id,
      refreshTokenHash,
      status: SessionStatus.ACTIVE,
    });

    return loginResponse;
  }
}
