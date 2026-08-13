import { HttpStatus } from '@nestjs/common';

export const CourseError = {
  NOT_FOUND: {
    code: 'COURSE.NOT_FOUND',
    message: 'Không tìm thấy khóa học',
    statusCode: HttpStatus.NOT_FOUND,
  },
  SLUG_ALREADY_EXISTS: {
    code: 'COURSE.SLUG_ALREADY_EXISTS',
    message: 'Slug khóa học đã tồn tại',
    statusCode: HttpStatus.CONFLICT,
  },
  PAID_COURSE_REQUIRES_PRICE: {
    code: 'COURSE.PAID_REQUIRES_PRICE',
    message: 'Khóa học trả phí phải có giá lớn hơn 0',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  FREE_COURSE_CANNOT_HAVE_PRICE: {
    code: 'COURSE.FREE_CANNOT_HAVE_PRICE',
    message: 'Khóa học miễn phí không được thiết lập giá',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  INVALID_PRICE: {
    code: 'COURSE.INVALID_PRICE',
    message: 'Giá khóa học không hợp lệ',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  INVALID_STATUS_TRANSITION: {
    code: 'COURSE.INVALID_STATUS_TRANSITION',
    message: 'Trạng thái khóa học không hợp lệ',
    statusCode: HttpStatus.BAD_REQUEST,
  },
} as const;
