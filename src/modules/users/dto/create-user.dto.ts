import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ValidationMessage } from 'src/common/constants/validation.messages';
import { Role } from 'src/generated/prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: ValidationMessage.EMAIL.INVALID })
  @IsNotEmpty({ message: ValidationMessage.EMAIL.REQUIRED })
  email!: string;

  @IsNotEmpty({ message: ValidationMessage.PASSWORD.REQUIRED })
  @MinLength(3, { message: ValidationMessage.PASSWORD.MIN_LENGTH })
  password!: string;

  // Only reachable via this ADMIN-only endpoint (POST /users) — this is how
  // additional ADMIN accounts get provisioned, since public registration is
  // disabled and students authenticate via Google only.
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
