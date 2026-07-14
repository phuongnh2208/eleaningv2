export interface SessionState {
  ensureCanRefresh(): void;
  ensureCanLogout(): void;
}
