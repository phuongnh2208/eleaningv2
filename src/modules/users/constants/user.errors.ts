import { HttpStatus } from '@nestjs/common';

export const UserError = {
  USER_NOT_FOUND: {
    code: 'USER.NOT_FOUND',
    message: 'Không tìm thấy người dùng',
    statusCode: HttpStatus.NOT_FOUND,
  },

  EMAIL_ALREADY_EXISTS: {
    code: 'USER.EMAIL_ALREADY_EXISTS',
    message: 'Email đã tồn tại',
    statusCode: HttpStatus.CONFLICT,
  },

  USER_ALREADY_INACTIVE: {
    code: 'USER.ALREADY_INACTIVE',
    message: 'Người dùng đã bị vô hiệu hóa',
    statusCode: HttpStatus.BAD_REQUEST,
  },
} as const;
