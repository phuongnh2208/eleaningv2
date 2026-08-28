import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';
import { EmailService, EmailServicePort } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const port = Number(config.get<number | string>('MAIL_PORT', 587));
        const localTemplateDir = join(__dirname, 'templates');
        const fallbackTemplateDir = join(
          process.cwd(),
          'src',
          'modules',
          'email',
          'templates',
        );
        const templateDir = existsSync(localTemplateDir)
          ? localTemplateDir
          : fallbackTemplateDir;

        return {
          transport: {
            host: config.get<string>('MAIL_HOST', 'smtp.gmail.com'),
            port,
            secure: port === 465,
            auth: {
              user: config.get<string>('MAIL_USER', ''),
              pass: (config.get<string>('MAIL_PASS', '') || '').replace(
                /\s+/g,
                '',
              ),
            },
          },
          defaults: {
            from: config.get<string>(
              'MAIL_FROM',
              '"E-Learning Platform" <noreply@elearning.vn>',
            ),
          },
          template: {
            dir: templateDir,
            adapter: new EjsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
    }),
  ],
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
