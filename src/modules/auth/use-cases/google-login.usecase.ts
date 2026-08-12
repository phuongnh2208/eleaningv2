import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from 'src/modules/users/repositories/user-repository.port';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { AuthTokenFactory } from '../factories/auth-token.factory';
import { SessionRepository } from 'src/modules/sessions/repositories/session.repository';
import { SessionStatus, Status } from 'src/generated/prisma/client';
import { PasswordHasherStrategy } from 'src/common/secret/hashing/password-hasher.strategy';

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly sessionRepository: SessionRepository,
    private readonly authTokenFactory: AuthTokenFactory,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
  ) {}

  async execute(googleUser: GoogleUser) {
    // Check if user exists by googleId
    let user = await this.userRepository.findByGoogleId(googleUser.googleId);

    if (user) {
      // User exists with this googleId, check status
      if (user.status === Status.BANNED) {
        throw new AppException(AuthError.USER_BANNED);
      }
    } else {
      // Check if user exists by email
      user = await this.userRepository.findByEmail(googleUser.email);

      if (user) {
        // User exists with email but no googleId, link the account
        if (user.status === Status.BANNED) {
          throw new AppException(AuthError.USER_BANNED);
        }
        user = await this.userRepository.updateUser(user.id, {
          googleId: googleUser.googleId,
        });
      } else {
        // Create new user with googleId
        user = await this.userRepository.createUser({
          email: googleUser.email,
          googleId: googleUser.googleId,
          passwordHash: null,
        });
      }
    }

    // Revoke all existing sessions
    await this.sessionRepository.revokeAllActiveByUserId(user.id);

    // Create new tokens
    const loginResponse = await this.authTokenFactory.createLoginResponse(user);
    const hashedRefreshToken = await this.passwordHasherStrategy.hash(
      loginResponse.refreshToken,
    );

    // Create new session
    await this.sessionRepository.create({
      userID: user.id,
      refreshTokenHash: hashedRefreshToken,
      status: SessionStatus.ACTIVE,
    });

    return loginResponse;
  }
}
