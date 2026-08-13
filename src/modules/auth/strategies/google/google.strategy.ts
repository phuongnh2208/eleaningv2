import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID:
        config.get<string>('GOOGLE_CLIENT_ID') ??
        'google-client-not-configured',
      clientSecret:
        config.get<string>('GOOGLE_CLIENT_SECRET') ??
        'google-client-secret-not-configured',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') ??
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): {
    googleId: string;
    email: string;
  } {
    const email = profile.emails?.[0]?.value?.toLowerCase();

    if (!email) {
      throw new Error('Google profile does not contain a verified email');
    }

    return {
      googleId: profile.id,
      email,
    };
  }
}
