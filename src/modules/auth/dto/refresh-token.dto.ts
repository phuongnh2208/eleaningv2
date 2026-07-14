import { IsNotEmpty, IsString } from 'class-validator';
import { ValidationMessage } from 'src/common/constants/validation.messages';

export class RefreshTokenDto {
  @IsNotEmpty({ message: ValidationMessage.REFRESH_TOKEN.REQUIRED })
  @IsString({ message: ValidationMessage.REFRESH_TOKEN.MUST_BE_STRING })
  refreshToken!: string;
}