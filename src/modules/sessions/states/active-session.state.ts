import { SessionState } from './session-state.interface';

export class ActiveSessionState implements SessionState {
  ensureCanRefresh(): void {}
  ensureCanLogout(): void {}
}
