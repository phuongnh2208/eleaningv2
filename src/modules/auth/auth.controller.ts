import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { RegisterUseCase } from './use-cases/regiser.usecase';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginUseCase } from './use-cases/login.usecase';
import { LogoutUsecase } from './use-cases/logout.usecase';
import { RefreshTokenUsecase } from './use-cases/refresh-token.usecase';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleLoginUseCase } from './use-cases/google-login.usecase';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUsecase,
    private readonly refreshTokenUseCase: RefreshTokenUsecase,
    private readonly googleLoginUseCase: GoogleLoginUseCase,
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

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleLogin() {
    return { message: 'Redirecting to Google' };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() request: { user: { googleId: string; email: string } },
  ) {
    return await this.googleLoginUseCase.execute(request.user);
  }
}
