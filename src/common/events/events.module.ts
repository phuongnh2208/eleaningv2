import { Module } from '@nestjs/common';
import { EventDispatcher } from './event-dispatcher';

@Module({
  providers: [EventDispatcher],
  exports: [EventDispatcher],
})
export class EventModule {}
