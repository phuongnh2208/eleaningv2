import { Module } from '@nestjs/common';
import { EmailService, EmailServicePort } from './email.service';

@Module({
  providers: [
    EmailService,
    {
      provide: EmailServicePort,
      useExisting: EmailService,
    },
  ],
  exports: [EmailServicePort],
})
export class EmailModule {}
