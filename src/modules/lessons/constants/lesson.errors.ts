import { HttpStatus } from '@nestjs/common';

export const LessonError = {
  NOT_FOUND: {
    code: 'LESSON.NOT_FOUND',
    message: 'Không tìm thấy bài học',
    statusCode: HttpStatus.NOT_FOUND,
  },
  COURSE_NOT_FOUND: {
    code: 'LESSON.COURSE_NOT_FOUND',
    message: 'Không tìm thấy khóa học của bài học',
    statusCode: HttpStatus.NOT_FOUND,
  },
  POSITION_ALREADY_EXISTS: {
    code: 'LESSON.POSITION_ALREADY_EXISTS',
    message: 'Vị trí bài học đã tồn tại trong khóa học',
    statusCode: HttpStatus.CONFLICT,
  },
  INVALID_POSITION: {
    code: 'LESSON.INVALID_POSITION',
    message: 'Vị trí bài học phải là số nguyên dương',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  VIDEO_URL_INVALID: {
    code: 'LESSON.VIDEO_URL_INVALID',
    message: 'Link video phải là Google Drive hợp lệ',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  PUBLISHED_LESSON_REQUIRES_VIDEO: {
    code: 'LESSON.PUBLISHED_REQUIRES_VIDEO',
    message: 'Bài học công khai phải có video',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  VIDEO_ACCESS_DENIED: {
    code: 'LESSON.VIDEO_ACCESS_DENIED',
    message: 'Bạn chưa có quyền xem video bài học này',
    statusCode: HttpStatus.FORBIDDEN,
  },
} as const;
