/* eslint-disable */
import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role, Status } from 'src/generated/prisma/client';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email?: string;
    
    @IsOptional()
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(3, { message: 'Mật khẩu phải từ 3 kí tự trở lên' })
    password?: string;

    @IsOptional()
    @IsEnum(Role, {message: "quyền phải là ADMIN hoặc USER"})
    role?: Role;
    
    @IsOptional()
    @IsEnum(Status, {message: "trạng thái phải là ACTIVE hoặc BANNED"})
    status?: Status;
}
