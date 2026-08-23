import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterUseCase } from './use-cases/regiser.usecase';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginUseCase } from './use-cases/login.usecase';
import { LogoutUsecase } from './use-cases/logout.usecase';
import { RefreshTokenUsecase } from './use-cases/refresh-token.usecase';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleLoginUseCase } from './use-cases/google-login.usecase';
import { GoogleLoginDto } from './dto/google-login.dto';
import { GoogleIdTokenVerifierService } from './services/google-id-token-verifier.service';
import { LinkGoogleAccountUseCase } from './use-cases/link-google-account.usecase';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUsecase,
    private readonly refreshTokenUseCase: RefreshTokenUsecase,
    private readonly googleLoginUseCase: GoogleLoginUseCase,
    private readonly googleIdTokenVerifier: GoogleIdTokenVerifierService,
    private readonly linkGoogleAccountUseCase: LinkGoogleAccountUseCase,
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

  @Post('google-login')
  async googleIdTokenLogin(@Body() body: GoogleLoginDto) {
    const profile = await this.googleIdTokenVerifier.verify(body.idToken);
    return await this.googleLoginUseCase.execute(profile);
  }

  // Links a verified Google identity to the caller's existing (email/password)
  // account, without creating a new user or session. Needed so a student who
  // registered with email/password can still meet the "correct Google
  // account" requirement for paid-video access.
  @UseGuards(JwtAuthGuard)
  @Post('link-google')
  async linkGoogleAccount(
    @Req() request: { user: { id: number } },
    @Body() body: GoogleLoginDto,
  ) {
    const profile = await this.googleIdTokenVerifier.verify(body.idToken);
    return await this.linkGoogleAccountUseCase.execute(
      request.user.id,
      profile,
    );
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
