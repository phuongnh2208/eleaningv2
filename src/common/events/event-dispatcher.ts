import { Injectable } from '@nestjs/common';
import { EventListener } from './event-listener.interface';

@Injectable()
export class EventDispatcher {
  private listenerRegistry: Record<string, EventListener[]> = {};
  register(eventName: string, listener: EventListener) {
    if (!this.listenerRegistry[eventName]) {
      this.listenerRegistry[eventName] = [];
    }
    this.listenerRegistry[eventName].push(listener);
  }
  async dispatch(event: { eventName: string }) {
    const eventListener = this.listenerRegistry[event.eventName] || [];
    for (const listener of eventListener) {
      await listener.handle(event);
    }
  }
}
