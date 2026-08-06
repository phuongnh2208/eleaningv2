import { Module } from '@nestjs/common';
import { RegisterUseCase } from './use-cases/regiser.usecase';
import { AuthController } from './auth.controller';
import { UserModule } from '../users/user.module';
import { LoginUseCase } from './use-cases/login.usecase';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthTokenFactory } from './factories/auth-token.factory';
import { SessionRepository } from '../sessions/repositories/session.repository';
import { RefreshTokenUsecase } from './use-cases/refresh-token.usecase';
import { LogoutUsecase } from './use-cases/logout.usecase';
import { HashingModule } from 'src/common/secret/hashing/hashing.module';
import { JwtStrategy } from './strategies/jwt/jwt.stratergy';
import { SessionStateFactory } from '../sessions/states/session-state.factory';
import { EventModule } from 'src/common/events/events.module';
import { AuditUserRegisteredObserver } from './observers/audit-user-registered.observer';
import { WelcomeUserRegisteredObserver } from './observers/welcome-user-registered.observer';
import { SecurityUserRegisteredObserver } from './observers/security-user-registered.observer';
import { AuthEventRegistrar } from './auth-event-registrar';

@Module({
  providers: [
    RegisterUseCase,
    LoginUseCase,
    AuthTokenFactory,
    SessionRepository,
    LogoutUsecase,
    RefreshTokenUsecase,
    JwtStrategy,
    SessionStateFactory,
    WelcomeUserRegisteredObserver,
    AuditUserRegisteredObserver,
    SecurityUserRegisteredObserver,
    AuthEventRegistrar,
  ],
  controllers: [AuthController],
  imports: [
    UserModule,
    HashingModule,
    EventModule,
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
