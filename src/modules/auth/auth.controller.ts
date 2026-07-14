import { Body, Controller, Post } from '@nestjs/common';
import { RegisterUseCase } from './use-cases/regiser.usecase';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginUseCase } from './use-cases/login.usecase';
import { LogoutUsecase } from './use-cases/logout.usecase';
import { RefreshTokenUsecase } from './use-cases/refresh-token.usecase';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUsecase,
    private readonly refreshTokenUseCase: RefreshTokenUsecase,
  ) {}
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return await this.registerUseCase.executive(body);
  }
  @Post('login')
  async login(@Body() body: LoginDto) {
    return await this.loginUseCase.excutive(body);
  }
  @Post('logout')
  async logout(@Body() body: RefreshTokenDto) {
    return await this.logoutUseCase.executive(body);
  }
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return await this.refreshTokenUseCase.executive(body);
  }
}
