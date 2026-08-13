import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from 'src/modules/users/repositories/user-repository.port';
import { LoginDto } from '../dto/login.dto';
import { AuthError } from '../constants/auth.errors';
import { AppException } from 'src/common/exceptions/app.exception';
import { PasswordHasherStrategy } from '../../../common/secret/hashing/password-hasher.strategy';
import { AuthTokenFactory } from '../factories/auth-token.factory';
import { SessionRepository } from 'src/modules/sessions/repositories/session.repository';
import { SessionStatus, Status } from 'src/generated/prisma/client';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly useRepository: UserRepositoryPort,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
    private readonly authTokenFactory: AuthTokenFactory,
  ) {}
  async excutive(data: LoginDto) {
    const user = await this.useRepository.findByEmail(data.email);
    if (!user || !user.passwordHash)
      throw new AppException(AuthError.INVALID_CREDENTIALS);
    if (user.status !== Status.ACTIVE)
      throw new AppException(AuthError.USER_BANNED);
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
