import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppException } from 'src/common/exceptions/app.exception';
import { Role } from 'src/generated/prisma/client';
import { AuthError } from '../../constants/auth.errors';
import { UserRepository } from 'src/modules/users/repositories/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET_KEY') || 'jwt-secret-key',
    });
  }
  async validate(payload: {
    sub: number;
    email: string;
    role: Role;
    type: string;
  }) {
    if (payload.type !== 'access')
      throw new AppException(AuthError.INVALID_TOKEN_TYPE);
    const user = await this.userRepository.findOne(payload.sub);
    if (!user) throw new AppException(AuthError.USER_NOT_FOUND);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
