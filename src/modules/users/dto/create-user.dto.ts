/* eslint-disable */
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ValidationMessage } from 'src/common/constants/validation.messages';

export class CreateUserDto {
  @IsEmail({}, { message: ValidationMessage.EMAIL.INVALID })
  @IsNotEmpty({ message: ValidationMessage.EMAIL.REQUIRED })
  email!: string;

  @IsNotEmpty({ message: ValidationMessage.PASSWORD.REQUIRED })
  @MinLength(3, { message: ValidationMessage.PASSWORD.MIN_LENGTH })
  password!: string;
}
