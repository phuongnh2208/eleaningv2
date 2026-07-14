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

  SESSION_NOT_FOUND: {
    code: 'AUTH.SESSION_NOT_FOUND',
    message: 'Không tìm thấy phiên đăng nhập đang hoạt động',
    statusCode: HttpStatus.UNAUTHORIZED,
  },

  SESSION_REVOKED: {
    code: 'AUTH.SESSION_REVOKED',
    message: 'Phiên đăng nhập đã bị thu hồi',
    statusCode: HttpStatus.UNAUTHORIZED,
  },

  SESSION_EXPIRED: {
    code: 'AUTH.SESSION_EXPIRED',
    message: 'Phiên đăng nhập đã hết hạn',
    statusCode: HttpStatus.UNAUTHORIZED,
  },

  TOKEN_EXPIRED: {
    code: 'AUTH.TOKEN_EXPIRED',
    message: 'Token đã hết hạn',
    statusCode: HttpStatus.UNAUTHORIZED,
  },
  FORBIDDEN: {
    code: 'AUTH.FORBIDDEN',
    message: 'Bạn không có quyền thực hiện hành động này',
    statusCode: HttpStatus.FORBIDDEN,
  },
  CANNOT_UPDATE_OTHER_USER: {
    code: 'AUTH.CANNOT_UPDATE_OTHER_USER',
    message: 'Không được phép cập nhật thông tin của người dùng khác',
    statusCode: HttpStatus.FORBIDDEN,
  },

  CANNOT_CHANGE_ROLE: {
    code: 'AUTH.CANNOT_CHANGE_ROLE',
    message: 'Bạn không có quyền thay đổi vai trò của tài khoản',
    statusCode: HttpStatus.FORBIDDEN,
  },

  CANNOT_CHANGE_STATUS: {
    code: 'AUTH.CANNOT_CHANGE_STATUS',
    message: 'Bạn không có quyền thay đổi trạng thái của tài khoản',
    statusCode: HttpStatus.FORBIDDEN,
  },

  CANNOT_CHANGE_OWN_ROLE: {
    code: 'AUTH.CANNOT_CHANGE_OWN_ROLE',
    message: 'Không được phép thay đổi vai trò của chính mình',
    statusCode: HttpStatus.FORBIDDEN,
  },

  CANNOT_CHANGE_OWN_STATUS: {
    code: 'AUTH.CANNOT_CHANGE_OWN_STATUS',
    message: 'Không được phép thay đổi trạng thái của chính mình',
    statusCode: HttpStatus.FORBIDDEN,
  },
} as const;
