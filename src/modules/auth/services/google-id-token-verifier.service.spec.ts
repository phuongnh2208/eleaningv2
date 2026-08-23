import { ConfigService } from '@nestjs/config';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { GoogleIdTokenVerifierService } from './google-id-token-verifier.service';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe('GoogleIdTokenVerifierService', () => {
  const makeConfig = (values: Record<string, string | undefined>) =>
    ({
      get: (key: string) => values[key],
    }) as unknown as ConfigService;

  beforeEach(() => {
    mockVerifyIdToken.mockReset();
  });

  it('returns the profile for a valid token', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        iss: 'https://accounts.google.com',
        email_verified: true,
        sub: 'google-123',
        email: 'Student@Example.com',
      }),
    });
    const service = new GoogleIdTokenVerifierService(
      makeConfig({ GOOGLE_CLIENT_ID: 'client-id' }),
    );

    const result = await service.verify('valid-token');

    expect(result).toEqual({
      googleId: 'google-123',
      email: 'student@example.com',
      name: null,
      picture: null,
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-token',
      audience: 'client-id',
    });
  });

  it('throws GOOGLE_NOT_CONFIGURED when GOOGLE_CLIENT_ID is missing', async () => {
    const service = new GoogleIdTokenVerifierService(makeConfig({}));

    await expect(service.verify('token')).rejects.toMatchObject({
      message: AuthError.GOOGLE_NOT_CONFIGURED.message,
    });
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('throws GOOGLE_ID_TOKEN_INVALID on wrong issuer', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        iss: 'https://evil.example.com',
        email_verified: true,
        sub: 'google-123',
        email: 'student@example.com',
      }),
    });
    const service = new GoogleIdTokenVerifierService(
      makeConfig({ GOOGLE_CLIENT_ID: 'client-id' }),
    );

    await expect(service.verify('token')).rejects.toMatchObject({
      message: AuthError.GOOGLE_ID_TOKEN_INVALID.message,
    });
  });

  it('throws GOOGLE_ID_TOKEN_INVALID when email_verified is false', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        iss: 'https://accounts.google.com',
        email_verified: false,
        sub: 'google-123',
        email: 'student@example.com',
      }),
    });
    const service = new GoogleIdTokenVerifierService(
      makeConfig({ GOOGLE_CLIENT_ID: 'client-id' }),
    );

    await expect(service.verify('token')).rejects.toBeInstanceOf(AppException);
  });

  it('throws GOOGLE_ID_TOKEN_INVALID when verifyIdToken rejects (wrong audience)', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Wrong recipient'));
    const service = new GoogleIdTokenVerifierService(
      makeConfig({ GOOGLE_CLIENT_ID: 'client-id' }),
    );

    await expect(service.verify('token')).rejects.toMatchObject({
      message: AuthError.GOOGLE_ID_TOKEN_INVALID.message,
    });
  });
});
