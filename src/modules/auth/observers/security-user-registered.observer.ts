import { Injectable, Logger } from '@nestjs/common';
import { EventListener } from 'src/common/events/event-listener.interface';
import { UserRegisteredEvent } from '../events/user-registered.event';

@Injectable()
export class SecurityUserRegisteredObserver implements EventListener<UserRegisteredEvent> {
  private readonly logger = new Logger(SecurityUserRegisteredObserver.name);
  handle(event: UserRegisteredEvent): Promise<void> | void {
    this.logger.log(`
            Security observer: new registration detected for email = ${event.user.email}
    `);
  }
}
