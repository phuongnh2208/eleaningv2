import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type PaymentRequest = {
  enrollmentId: number;
  amount: string;
  currency: string;
};

export type PaymentResult = {
  success: boolean;
  externalReference: string;
};

export abstract class PaymentGatewayPort {
  abstract charge(input: PaymentRequest): Promise<PaymentResult>;
}

@Injectable()
export class MockPaymentGateway extends PaymentGatewayPort {
  charge(input: PaymentRequest): Promise<PaymentResult> {
    return Promise.resolve({
      success: true,
      externalReference: `MOCK-${input.enrollmentId}-${randomUUID()}`,
    });
  }
}
