import { HttpStatus } from '@nestjs/common';

export const AuthError = {
  INVALID_CREDENTIALS: {
    code: 'AUTH.INVALID_CREDENTIALS',
    message: 'Email hoặc mật khẩu không đúng',
    statusCode: HttpStatus.UNAUTHORIZED,
  },

  EMAIL_ALREADY_EXISTS: {
    code: 'AUTH.EMAIL_ALREADY_EXISTS',
    message: 'Email đã tồn tại',
    statusCode: HttpStatus.CONFLICT,
  },

  TOKEN_INVALID: {
    code: 'AUTH.TOKEN_INVALID',
    message: 'Token không hợp lệ',
    statusCode: HttpStatus.UNAUTHORIZED,
  },

  TOKEN_EXPIRED: {
    code: 'AUTH.TOKEN_EXPIRED',
    message: 'Token đã hết hạn',
    statusCode: HttpStatus.UNAUTHORIZED,
  },
} as const;
