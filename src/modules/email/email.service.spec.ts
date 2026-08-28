import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;
  let mailerService: jest.Mocked<MailerService>;

  beforeEach(async () => {
    const configMock = {
      get: jest.fn(),
    };

    const mailerMock = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: configMock },
        { provide: MailerService, useValue: mailerMock },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);
    mailerService = module.get(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPublicEnrollmentGuidance', () => {
    it('should send guidance email via MailerService (SMTP) when provider is smtp', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'EMAIL_PROVIDER') return 'smtp';
        if (key === 'PAYMENT_BANK_ACCOUNT_NAME') return 'TEST BANK ACCOUNT';
        if (key === 'PAYMENT_BANK_ACCOUNT_NUMBER') return '9999999999';
        if (key === 'PAYMENT_BANK_NAME') return 'Vietcombank Test';
        if (key === 'CLASS_SCHEDULE_INFO') return 'Tối thứ 3-5';
        return defaultValue;
      });

      await service.sendPublicEnrollmentGuidance({
        recipient: 'student@example.com',
        contactName: 'Nguyen Van A',
        courseTitle: 'NestJS Masterclass',
        amount: '500000',
        currency: 'VND',
        enrollmentId: 101,
      });

      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'student@example.com',
          template: 'enrollment-guidance',
          subject: 'Hướng dẫn thanh toán khóa học: NestJS Masterclass',
          context: expect.objectContaining({
            contactName: 'Nguyen Van A',
            courseTitle: 'NestJS Masterclass',
            recipient: 'student@example.com',
            bankName: 'Vietcombank Test',
            bankAccountName: 'TEST BANK ACCOUNT',
            bankAccountNumber: '9999999999',
            amount: '500000',
            currency: 'VND',
            transferNote: 'DK 101 student@example.com',
            scheduleInfo: 'Tối thứ 3-5',
            enrollmentId: 101,
          }),
        }),
      );
    });

    it('should log to console when provider is console', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'EMAIL_PROVIDER') return 'console';
        return defaultValue;
      });

      await service.sendPublicEnrollmentGuidance({
        recipient: 'student@example.com',
        contactName: 'Nguyen Van A',
        courseTitle: 'NestJS Masterclass',
        amount: '500000',
        currency: 'VND',
        enrollmentId: 101,
      });

      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('sendEnrollmentConfirmation', () => {
    it('should send confirmation email via MailerService (SMTP) when provider is smtp', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'EMAIL_PROVIDER') return 'smtp';
        return defaultValue;
      });

      await service.sendEnrollmentConfirmation({
        recipient: 'student@example.com',
        courseTitle: 'NestJS Masterclass',
        status: 'ACTIVE',
        enrollmentId: 101,
        paymentReference: 'PAY-123456',
      });

      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'student@example.com',
          template: 'enrollment-confirmation',
          subject: 'Xác nhận đăng ký khóa học: NestJS Masterclass',
          context: expect.objectContaining({
            courseTitle: 'NestJS Masterclass',
            status: 'ACTIVE',
            enrollmentId: 101,
            paymentReference: 'PAY-123456',
          }),
        }),
      );
    });
  });
});
