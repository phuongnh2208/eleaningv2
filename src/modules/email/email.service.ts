import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  constructor(private readonly config: ConfigService) {
    super();
  }

  async sendEnrollmentConfirmation(
    input: EnrollmentConfirmationEmail,
  ): Promise<void> {
    const provider = this.config.get<string>('EMAIL_PROVIDER', 'console');

    if (provider === 'resend') {
      await this.sendWithResend(input);
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
    const provider = this.config.get<string>('EMAIL_PROVIDER', 'console');
    const body = this.buildGuidanceText(input);

    if (provider === 'resend') {
      const apiKey = this.config.get<string>('RESEND_API_KEY');
      const from = this.config.get<string>('EMAIL_FROM');

      if (!apiKey || !from) {
        throw new Error(
          'RESEND_API_KEY và EMAIL_FROM là bắt buộc khi EMAIL_PROVIDER=resend',
        );
      }

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
        throw new Error(
          `Email provider trả về HTTP ${response.status}: ${text}`,
        );
      }
      return;
    }

    this.logger.log(`[console email] to=${input.recipient}\n${body}`);
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

  private async sendWithResend(
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
}
