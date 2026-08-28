import { HttpStatus } from '@nestjs/common';

export const EnrollmentError = {
  COURSE_NOT_FOUND: {
    code: 'ENROLLMENT.COURSE_NOT_FOUND',
    message: 'Khóa học không tồn tại',
    statusCode: HttpStatus.NOT_FOUND,
  },
  COURSE_NOT_AVAILABLE: {
    code: 'ENROLLMENT.COURSE_NOT_AVAILABLE',
    message: 'Khóa học chưa sẵn sàng để đăng ký',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  ALREADY_ENROLLED: {
    code: 'ENROLLMENT.ALREADY_ENROLLED',
    message: 'Bạn đã đăng ký khóa học này',
    statusCode: HttpStatus.CONFLICT,
  },
  ENROLLMENT_EXISTS: {
    code: 'ENROLLMENT.EXISTS',
    message: 'Bản đăng ký khóa học đã tồn tại và chưa thể tạo lại',
    statusCode: HttpStatus.CONFLICT,
  },
  NOT_FOUND: {
    code: 'ENROLLMENT.NOT_FOUND',
    message: 'Không tìm thấy bản đăng ký khóa học',
    statusCode: HttpStatus.NOT_FOUND,
  },
  FORBIDDEN: {
    code: 'ENROLLMENT.FORBIDDEN',
    message: 'Bạn không có quyền thao tác trên bản đăng ký này',
    statusCode: HttpStatus.FORBIDDEN,
  },
  PAYMENT_REQUIRED: {
    code: 'ENROLLMENT.PAYMENT_REQUIRED',
    message: 'Khóa học yêu cầu thanh toán trước khi truy cập',
    statusCode: HttpStatus.PAYMENT_REQUIRED,
  },
  PAYMENT_NOT_FOUND: {
    code: 'ENROLLMENT.PAYMENT_NOT_FOUND',
    message: 'Không tìm thấy thông tin thanh toán',
    statusCode: HttpStatus.NOT_FOUND,
  },
  PAYMENT_ALREADY_PROCESSED: {
    code: 'ENROLLMENT.PAYMENT_ALREADY_PROCESSED',
    message: 'Khoản thanh toán đã được xử lý trước đó',
    statusCode: HttpStatus.CONFLICT,
  },
  PAYMENT_FAILED: {
    code: 'ENROLLMENT.PAYMENT_FAILED',
    message: 'Thanh toán không thành công',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  INVALID_ID: {
    code: 'ENROLLMENT.INVALID_ID',
    message: 'Mã đăng ký không hợp lệ',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  FREE_COURSE_REQUIRES_LOGIN: {
    code: 'ENROLLMENT.FREE_COURSE_REQUIRES_LOGIN',
    message:
      'Khóa học này miễn phí — vui lòng đăng nhập và tự đăng ký tại POST /enrollments/courses/:courseId',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  ALREADY_CANCELLED: {
    code: 'ENROLLMENT.ALREADY_CANCELLED',
    message: 'Bản đăng ký đã bị hủy trước đó',
    statusCode: HttpStatus.CONFLICT,
  },
  CANNOT_CANCEL_ACTIVE: {
    code: 'ENROLLMENT.CANNOT_CANCEL_ACTIVE',
    message: 'Không thể hủy bản đăng ký đã kích hoạt thành công',
    statusCode: HttpStatus.BAD_REQUEST,
  },
} as const;
