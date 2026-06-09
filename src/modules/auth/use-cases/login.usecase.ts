/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { LoginDto } from '../dto/login.dto';
import { AuthError } from '../constants/auth.errors';
import { AppException } from 'src/common/exceptions/app.exception';
import { PasswordHasherStrategy } from '../strategies/password-hasher.strategy';
import { AuthTokenFactory } from '../factories/auth-token.factory';
import { SessionRepository } from 'src/modules/sessions/repositories/session.repository';
import { SessionStatus } from 'src/generated/prisma/client';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly useRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
    private readonly authTokenFactory: AuthTokenFactory,
  ) {}
  async excutive(data: LoginDto) {
    const user = await this.useRepository.findByEmail(data.email);
    if (!user) throw new AppException(AuthError.INVALID_CREDENTIALS);
    // const isPasswordCorrect = user.passwordHash === data.password;
    const isPasswordCorrect = await this.passwordHasherStrategy.compare(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordCorrect)
      throw new AppException(AuthError.INVALID_CREDENTIALS);
    // Revoke all session by userID
    await this.sessionRepository.revokeAllActiveByUserId(user.id);
    const loginResponse = await this.authTokenFactory.createLoginResponse(user);
    const hasedRefreshToken = await this.passwordHasherStrategy.hash(
      loginResponse.refreshToken,
    );

    await this.sessionRepository.create({
      userID: user.id,
      refreshTokenHash: hasedRefreshToken,
      status: SessionStatus.ACTIVE,
    });
    return await this.authTokenFactory.createLoginResponse(user);
  }
}
