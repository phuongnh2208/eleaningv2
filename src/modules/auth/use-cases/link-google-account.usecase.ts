import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from 'src/modules/users/repositories/user-repository.port';
import { UserMapper } from 'src/modules/users/mappers/user.mapper';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { GoogleProfile } from './google-login.usecase';

// Lets an already-authenticated (email/password) user attach a verified
// Google identity to their existing account — distinct from
// GoogleLoginUseCase, which signs a caller in from scratch (creating or
// finding a user by email). This never creates a new user or a new session;
// it only records googleId/name/picture on the current account so that
// course-access checks (VideoAccessGuard) can later match the caller's
// verified Google email against an Enrollment.
@Injectable()
export class LinkGoogleAccountUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(currentUserId: number, profile: GoogleProfile) {
    const owner = await this.userRepository.findByGoogleId(profile.googleId);
    if (owner && owner.id !== currentUserId) {
      throw new AppException(
        AuthError.GOOGLE_ALREADY_LINKED_TO_ANOTHER_ACCOUNT,
      );
    }

    const currentUser = await this.userRepository.findOne(currentUserId);
    if (!currentUser) {
      throw new AppException(AuthError.USER_NOT_FOUND);
    }

    if (currentUser.googleId && currentUser.googleId !== profile.googleId) {
      throw new AppException(AuthError.GOOGLE_ACCOUNT_MISMATCH);
    }

    const updated = await this.userRepository.updateUser(currentUserId, {
      googleId: profile.googleId,
      name: profile.name ?? currentUser.name,
      picture: profile.picture ?? currentUser.picture,
    });

    return UserMapper.toResponse(updated);
  }
}
