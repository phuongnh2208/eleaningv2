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

  REFRESH_TOKEN_INVALID: {
    code: 'AUTH.REFRESH_TOKEN_INVALID',
    message: 'Refresh token không hợp lệ',
    statusCode: HttpStatus.UNAUTHORIZED,
  },

  INVALID_TOKEN_TYPE: {
    code: 'AUTH.INVALID_TOKEN_TYPE',
    message: 'Loại token không hợp lệ',
    statusCode: HttpStatus.UNAUTHORIZED,
  },

  USER_NOT_FOUND: {
    code: 'AUTH.USER_NOT_FOUND',
    message: 'Không tìm thấy người dùng',
    statusCode: HttpStatus.UNAUTHORIZED,
  },

  ACTIVE_SESSION_NOT_FOUND: {
    code: 'AUTH.ACTIVE_SESSION_NOT_FOUND',
    message: 'Không tìm thấy phiên đăng nhập đang hoạt động',
    statusCode: HttpStatus.UNAUTHORIZED,
  },

  TOKEN_EXPIRED: {
    code: 'AUTH.TOKEN_EXPIRED',
    message: 'Token đã hết hạn',
    statusCode: HttpStatus.UNAUTHORIZED,
  },
} as const;
