import { HttpException } from '@nestjs/common';

type AppError = {
  code: string;
  message: string;
  statusCode: number;
};

export class AppException extends HttpException {
  constructor(error: AppError) {
    super(
      {
        status: false,
        code: error.code,
        message: error.message,
      },
      error.statusCode,
    );
  }
}
