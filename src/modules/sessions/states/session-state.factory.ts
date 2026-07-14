import { Injectable } from '@nestjs/common';
import { SessionStatus } from 'src/generated/prisma/client';
import { ActiveSessionState } from './active-session.state';
import { RevokedSessionState } from './revoked-session.state';
import { ExpiredSessionState } from './expried-session.state';

@Injectable()
export class SessionStateFactory {
  create(status: SessionStatus) {
    switch (status) {
      case SessionStatus.ACTIVE:
        return new ActiveSessionState();
      case SessionStatus.REVOKED:
        return new RevokedSessionState();
      case SessionStatus.EXPIRED:
        return new ExpiredSessionState();
      default:
        return new RevokedSessionState();
    }
  }
}
