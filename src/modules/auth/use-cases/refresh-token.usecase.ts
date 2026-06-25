/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { RefreshTokenDto } from '../dto/refresh-token.dto.ts';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { SessionRepository } from 'src/modules/sessions/repositories/session.repository';
import { PasswordHasherStrategy } from '../strategies/hashing/password-hasher.strategy.js';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { SessionStatus } from 'src/generated/prisma/client';
import { AuthTokenFactory } from '../factories/auth-token.factory';

@Injectable()
export class RefreshTokenUsecase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
    private readonly authTokenFactory: AuthTokenFactory,
  ) {}
  async executive(data: RefreshTokenDto) {
    let payload;
    try {
      payload = await this.jwtService.verify(data.refreshToken);
    } catch (error) {
      throw new AppException(AuthError.REFRESH_TOKEN_INVALID);
    }
    if (payload.type !== 'refresh')
      throw new AppException(AuthError.INVALID_TOKEN_TYPE);

    const user = await this.userRepository.findOne(payload.sub);
    if (!user) 
        throw new AppException(AuthError.USER_NOT_FOUND);

    const session = await this.sessionRepository.findActiveByUserId(user.id);
    if (!session) 
        throw new AppException(AuthError.ACTIVE_SESSION_NOT_FOUND);

    const isRefreshTokenCorrect = await this.passwordHasherStrategy.compare(
      data.refreshToken,
      session.refreshTokenHash,
    );
    if (!isRefreshTokenCorrect) 
        throw new AppException(AuthError.TOKEN_EXPIRED);

    const accessToken = await this.authTokenFactory.createAccessToken(user);
    return {
        accessToken
    };
  }
}
