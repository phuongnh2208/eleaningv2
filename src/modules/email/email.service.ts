import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

export type EnrollmentConfirmationEmail = {
  recipient: string;
  courseTitle: string;
  status: 'ACTIVE' | 'PENDING';
  enrollmentId: number;
  paymentReference?: string;
};

export type PublicEnrollmentGuidanceEmail = {
  recipient: string;
  contactName: string;
  courseTitle: string;
  amount: string;
  currency: string;
  enrollmentId: number;
};

export abstract class EmailServicePort {
  abstract sendEnrollmentConfirmation(
    input: EnrollmentConfirmationEmail,
  ): Promise<void>;
  abstract sendPublicEnrollmentGuidance(
    input: PublicEnrollmentGuidanceEmail,
  ): Promise<void>;
}

@Injectable()
export class EmailService extends EmailServicePort {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly mailerService?: MailerService,
  ) {
    super();
  }

  async sendEnrollmentConfirmation(
    input: EnrollmentConfirmationEmail,
  ): Promise<void> {
    const provider = this.config.get<string>('EMAIL_PROVIDER', 'smtp');

    if (provider === 'smtp' && this.mailerService) {
      await this.sendConfirmationWithSmtp(input);
      return;
    }

    if (provider === 'resend') {
      await this.sendConfirmationWithResend(input);
      return;
    }

    this.logger.log(
      `[console email] to=${input.recipient} course=${input.courseTitle} ` +
        `enrollment=${input.enrollmentId} status=${input.status}`,
    );
  }

  async sendPublicEnrollmentGuidance(
    input: PublicEnrollmentGuidanceEmail,
  ): Promise<void> {
    const provider = this.config.get<string>('EMAIL_PROVIDER', 'smtp');

    if (provider === 'smtp' && this.mailerService) {
      await this.sendGuidanceWithSmtp(input);
      return;
    }

    if (provider === 'resend') {
      await this.sendGuidanceWithResend(input);
      return;
    }

    const body = this.buildGuidanceText(input);
    this.logger.log(`[console email] to=${input.recipient}\n${body}`);
  }

  private async sendGuidanceWithSmtp(
    input: PublicEnrollmentGuidanceEmail,
  ): Promise<void> {
    const bankAccountName = this.config.get<string>(
      'PAYMENT_BANK_ACCOUNT_NAME',
      'CONG TY GIAO DUC ELEARNING',
    );
    const bankAccountNumber = this.config.get<string>(
      'PAYMENT_BANK_ACCOUNT_NUMBER',
      '0000000000',
    );
    const bankName = this.config.get<string>(
      'PAYMENT_BANK_NAME',
      'Ngân hàng (chưa cấu hình)',
    );
    const scheduleInfo = this.config.get<string>(
      'CLASS_SCHEDULE_INFO',
      'Lịch học và hình thức học (online/offline) sẽ được thông báo qua email sau khi xác nhận thanh toán.',
    );
    const transferNote = `DK ${input.enrollmentId} ${input.recipient}`.trim();
    const textBody = this.buildGuidanceText(input);

    if (!this.mailerService) {
      throw new Error('MailerService chưa được khởi tạo');
    }

    await this.mailerService.sendMail({
      to: input.recipient,
      subject: `Hướng dẫn thanh toán khóa học: ${input.courseTitle}`,
      template: 'enrollment-guidance',
      text: textBody,
      context: {
        contactName: input.contactName,
        courseTitle: input.courseTitle,
        recipient: input.recipient,
        bankName,
        bankAccountName,
        bankAccountNumber,
        amount: input.amount,
        currency: input.currency,
        transferNote,
        scheduleInfo,
        enrollmentId: input.enrollmentId,
      },
    });

    this.logger.log(
      `[SMTP] Đã gửi email hướng dẫn đăng ký đến: ${input.recipient}`,
    );
  }

  private async sendConfirmationWithSmtp(
    input: EnrollmentConfirmationEmail,
  ): Promise<void> {
    if (!this.mailerService) {
      throw new Error('MailerService chưa được khởi tạo');
    }

    const statusText =
      input.status === 'ACTIVE'
        ? 'Khóa học của bạn đã được kích hoạt thành công.'
        : 'Vui lòng hoàn tất thanh toán để kích hoạt quyền học.';

    await this.mailerService.sendMail({
      to: input.recipient,
      subject: `Xác nhận đăng ký khóa học: ${input.courseTitle}`,
      template: 'enrollment-confirmation',
      text: [
        `Xin chào,`,
        `Bạn vừa đăng ký khóa học "${input.courseTitle}".`,
        statusText,
        `Mã đăng ký: ${input.enrollmentId}.`,
        input.paymentReference ? `Mã giao dịch: ${input.paymentReference}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      context: {
        courseTitle: input.courseTitle,
        status: input.status,
        enrollmentId: input.enrollmentId,
        paymentReference: input.paymentReference,
      },
    });

    this.logger.log(
      `[SMTP] Đã gửi email xác nhận khóa học đến: ${input.recipient}`,
    );
  }

  private async sendGuidanceWithResend(
    input: PublicEnrollmentGuidanceEmail,
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM');

    if (!apiKey || !from) {
      throw new Error(
        'RESEND_API_KEY và EMAIL_FROM là bắt buộc khi EMAIL_PROVIDER=resend',
      );
    }

    const body = this.buildGuidanceText(input);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.recipient],
        subject: `Hướng dẫn thanh toán khóa học: ${input.courseTitle}`,
        text: body,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Email provider trả về HTTP ${response.status}: ${text}`);
    }
  }

  private async sendConfirmationWithResend(
    input: EnrollmentConfirmationEmail,
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM');

    if (!apiKey || !from) {
      throw new Error(
        'RESEND_API_KEY và EMAIL_FROM là bắt buộc khi EMAIL_PROVIDER=resend',
      );
    }

    const statusText =
      input.status === 'ACTIVE'
        ? 'Bạn đã có thể bắt đầu học.'
        : 'Vui lòng hoàn tất thanh toán để kích hoạt quyền học.';
    const paymentText = input.paymentReference
      ? `Mã giao dịch: ${input.paymentReference}`
      : '';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.recipient],
        subject: `Xác nhận đăng ký khóa học: ${input.courseTitle}`,
        text: [
          `Xin chào,`,
          `Bạn vừa đăng ký khóa học "${input.courseTitle}".`,
          statusText,
          `Mã đăng ký: ${input.enrollmentId}.`,
          paymentText,
        ]
          .filter(Boolean)
          .join('\n'),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Email provider trả về HTTP ${response.status}: ${body}`);
    }
  }

  private buildGuidanceText(input: PublicEnrollmentGuidanceEmail): string {
    const bankAccountName = this.config.get<string>(
      'PAYMENT_BANK_ACCOUNT_NAME',
      'CONG TY GIAO DUC ELEARNING',
    );
    const bankAccountNumber = this.config.get<string>(
      'PAYMENT_BANK_ACCOUNT_NUMBER',
      '0000000000',
    );
    const bankName = this.config.get<string>(
      'PAYMENT_BANK_NAME',
      'Ngân hàng (chưa cấu hình)',
    );
    const scheduleInfo = this.config.get<string>(
      'CLASS_SCHEDULE_INFO',
      'Lịch học và hình thức học (online/offline) sẽ được thông báo qua email sau khi xác nhận thanh toán.',
    );
    const transferNote = `DK ${input.enrollmentId} ${input.recipient}`.trim();

    return [
      `Xin chào ${input.contactName},`,
      `Bạn vừa đăng ký khóa học "${input.courseTitle}". Vui lòng hoàn tất thanh toán theo thông tin dưới đây:`,
      `- Ngân hàng: ${bankName}`,
      `- Chủ tài khoản: ${bankAccountName}`,
      `- Số tài khoản: ${bankAccountNumber}`,
      `- Số tiền: ${input.amount} ${input.currency}`,
      `- Nội dung chuyển khoản: ${transferNote}`,
      `Sau khi chuyển khoản, vui lòng trả lời email này kèm ảnh chụp biên lai/giao dịch để admin xác nhận thanh toán.`,
      `Lưu ý quan trọng: hãy dùng đúng địa chỉ Gmail bạn đã đăng ký (${input.recipient}) để đăng nhập bằng Google — quyền truy cập video khóa học sẽ được cấp cho đúng địa chỉ Gmail này sau khi admin xác nhận thanh toán.`,
      `Thông tin lịch học: ${scheduleInfo}`,
      `Mã đăng ký: ${input.enrollmentId}.`,
    ].join('\n');
  }
}
