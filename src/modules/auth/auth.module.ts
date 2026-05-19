import { Module } from '@nestjs/common';
import { RegisterUseCase } from './use-cases/regiser.usecase';
import { AuthController } from './auth.controller';
import { UserModule } from '../users/user.module';
import { LoginUseCase } from './use-cases/login.usecase';

@Module({
  providers: [RegisterUseCase, LoginUseCase],
  controllers: [AuthController],
  imports: [UserModule],
})
export class AuthModule {}
