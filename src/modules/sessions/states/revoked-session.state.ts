import { AppException } from 'src/common/exceptions/app.exception';
import { SessionState } from './session-state.interface';
import { AuthError } from 'src/modules/auth/constants/auth.errors';

export class RevokedSessionState implements SessionState {
  ensureCanRefresh(): void {
    throw new AppException(AuthError.SESSION_REVOKED);
  }
  ensureCanLogout(): void {
    throw new AppException(AuthError.SESSION_REVOKED);
  }
}
