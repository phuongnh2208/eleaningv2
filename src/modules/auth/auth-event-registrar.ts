import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventDispatcher } from 'src/common/events/event-dispatcher';
import { WelcomeUserRegisteredObserver } from './observers/welcome-user-registered.observer';
import { AuditUserRegisteredObserver } from './observers/audit-user-registered.observer';
import { SecurityUserRegisteredObserver } from './observers/security-user-registered.observer';
import { UserRegisteredEvent } from './events/user-registered.event';

@Injectable()
export class AuthEventRegistrar implements OnModuleInit {
  constructor(
    private readonly eventDispatcher: EventDispatcher,
    private readonly welcomeUserRegisteredObserver: WelcomeUserRegisteredObserver,
    private readonly auditUserRegisteredObserver: AuditUserRegisteredObserver,
    private readonly securityUserRegisteredObserver: SecurityUserRegisteredObserver,
  ) {}

  onModuleInit() {
    this.eventDispatcher.register(
      UserRegisteredEvent.eventName,
      this.welcomeUserRegisteredObserver,
    );
    this.eventDispatcher.register(
      UserRegisteredEvent.eventName,
      this.auditUserRegisteredObserver,
    );
    this.eventDispatcher.register(
      UserRegisteredEvent.eventName,
      this.securityUserRegisteredObserver,
    );
  }
}
