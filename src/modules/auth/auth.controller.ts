import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RegisterUseCase } from './use-cases/regiser.usecase';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginUseCase } from './use-cases/login.usecase';
import { LogoutUsecase } from './use-cases/logout.usecase';
import { RefreshTokenUsecase } from './use-cases/refresh-token.usecase';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleLoginUseCase } from './use-cases/google-login.usecase';
import type { Response } from 'express';

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

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

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Initiates Google OAuth2 flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: { user: GoogleUser },
    @Res() res: Response,
  ) {
    const googleUser = req.user;
    const result = await this.googleLoginUseCase.execute(googleUser);

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }
}
