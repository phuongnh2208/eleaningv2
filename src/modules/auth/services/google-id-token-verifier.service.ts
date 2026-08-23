import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { GoogleProfile } from '../use-cases/google-login.usecase';

@Injectable()
export class GoogleIdTokenVerifierService {
  private readonly client: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    this.client = new OAuth2Client();
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new AppException(AuthError.GOOGLE_NOT_CONFIGURED);
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();

      if (
        !payload ||
        payload.iss !== 'https://accounts.google.com' ||
        payload.email_verified !== true ||
        !payload.sub ||
        !payload.email
      ) {
        throw new AppException(AuthError.GOOGLE_ID_TOKEN_INVALID);
      }

      return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name ?? null,
        picture: payload.picture ?? null,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(AuthError.GOOGLE_ID_TOKEN_INVALID);
    }
  }
}
