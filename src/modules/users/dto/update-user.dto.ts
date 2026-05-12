/* eslint-disable */
import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ValidationMessage } from 'src/common/constants/validation.messages';
import { Role, Status } from 'src/generated/prisma/client';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail({}, { message: ValidationMessage.EMAIL.INVALID })
    @IsNotEmpty({ message: ValidationMessage.EMAIL.REQUIRED })
    email?: string;
    
    @IsOptional()
    @IsNotEmpty({ message: ValidationMessage.PASSWORD.REQUIRED })
    @MinLength(3, { message: ValidationMessage.PASSWORD.MIN_LENGTH })
    password?: string;

    @IsOptional()
    @IsEnum(Role, {message: ValidationMessage.ROLE.INVALID})
    role?: Role;
    
    @IsOptional()
    @IsEnum(Status, {message: ValidationMessage.STATUS.INVALID})
    @IsNotEmpty({ message: ValidationMessage.STATUS.REQUIRED})
    status?: Status;
}
