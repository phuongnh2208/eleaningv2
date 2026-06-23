import { Module } from '@nestjs/common';
import { RegisterUseCase } from './use-cases/regiser.usecase';
import { AuthController } from './auth.controller';
import { UserModule } from '../users/user.module';
import { LoginUseCase } from './use-cases/login.usecase';
import { BcyptPasswordHasherStrategy } from './strategies/bcrypt-password-hasher.strategy';
import { PasswordHasherStrategy } from './strategies/password-hasher.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthTokenFactory } from './factories/auth-token.factory';
import { SessionRepository } from '../sessions/repositories/session.repository';
import { RefreshTokenUsecase } from './use-cases/refresh-token.usecase';
import { LogoutUsecase } from './use-cases/logout.usecase';

@Module({
  providers: [
    RegisterUseCase,
    LoginUseCase,
    AuthTokenFactory,
    SessionRepository,
    LogoutUsecase,
    RefreshTokenUsecase,
    BcyptPasswordHasherStrategy,
    {
      provide: PasswordHasherStrategy,
      useClass: BcyptPasswordHasherStrategy,
    },
  ],
  controllers: [AuthController],
  imports: [
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY') || 'jwt_secret_key',
        signOptions: {
          expiresIn: Number(config.get<string>('JWT_EXPIRES_IN')) || 6000,
        },
      }),
    }),
  ],
})
export class AuthModule {}
