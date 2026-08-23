import { IsOptional, IsString, MinLength } from 'class-validator';

export class ConfirmPaymentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  paymentToken?: string;
}
