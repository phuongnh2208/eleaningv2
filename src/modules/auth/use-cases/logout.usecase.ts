/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { RefreshTokenDto } from '../dto/refresh-token.dto.ts';
import { JwtService } from '@nestjs/jwt';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { SessionRepository } from 'src/modules/sessions/repositories/session.repository';
import { PasswordHasherStrategy } from '../../../common/secret/hashing/password-hasher.strategy.js';
import { SessionStatus } from 'src/generated/prisma/client';

@Injectable()
export class LogoutUsecase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
  ) {}
  async executive(data: RefreshTokenDto) {
    let payload;
    try {
      payload = await this.jwtService.verify(data.refreshToken);
    } catch (error) {
      throw new AppException(AuthError.REFRESH_TOKEN_INVALID);
    }

    if (payload.type! == 'refresh')
      throw new AppException(AuthError.INVALID_TOKEN_TYPE);

    const user = await this.userRepository.findOne(payload.sub);
    if (!user) throw new AppException(AuthError.USER_NOT_FOUND);

    const session = await this.sessionRepository.findActiveByUserId(user.id);
    if (!session) throw new AppException(AuthError.ACTIVE_SESSION_NOT_FOUND);

    const isRefreshTokenCorrect = await this.passwordHasherStrategy.compare(
      data.refreshToken,
      session.refreshTokenHash,
    );
    if (!isRefreshTokenCorrect) throw new AppException(AuthError.TOKEN_EXPIRED);

    await this.sessionRepository.updateStatus(
      session.id,
      SessionStatus.REVOKED,
    );
    return {
      message: 'Logged out successfully',
    };
  }
}
