import { Injectable, Logger } from '@nestjs/common';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { EventListener } from 'src/common/events/event-listener.interface';

@Injectable()
export class WelcomeUserRegisteredObserver implements EventListener<UserRegisteredEvent> {
  private readonly logger = new Logger(WelcomeUserRegisteredObserver.name);
  handle(event: UserRegisteredEvent): Promise<void> | void {
    this.logger.log(
      `Welcome observer: welcom new user with email = ${event.user.email}`,
    );
  }
}
