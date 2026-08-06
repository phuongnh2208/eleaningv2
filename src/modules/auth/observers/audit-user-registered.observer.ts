import { Injectable, Logger } from '@nestjs/common';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { EventListener } from 'src/common/events/event-listener.interface';

@Injectable()
export class AuditUserRegisteredObserver implements EventListener<UserRegisteredEvent> {
  private readonly logger = new Logger(AuditUserRegisteredObserver.name);
  handle(event: UserRegisteredEvent): Promise<void> | void {
    this.logger.log(
      `Audit observer: user registered with id = ${event.user.id}, email = ${event.user.email}`,
    );
  }
}
