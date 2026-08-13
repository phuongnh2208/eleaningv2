import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import {
  CourseAccessType,
  CourseStatus,
  LessonAccessType,
  Role,
} from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { LessonError } from '../constants/lesson.errors';
import { PrismaService } from 'prisma/prisma.service';

type AuthenticatedRequest = {
  params: { id?: string };
  user: { id: number; role: Role };
};

@Injectable()
export class VideoAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const lessonId = Number(request.params.id);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      throw new AppException(LessonError.NOT_FOUND);
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: true,
        video: true,
      },
    });

    if (
      !lesson ||
      !lesson.video ||
      !lesson.isPublished ||
      lesson.course.status !== CourseStatus.PUBLISHED
    ) {
      throw new AppException(LessonError.VIDEO_ACCESS_DENIED);
    }

    if (request.user.role === Role.ADMIN) return true;

    const isFreeLesson =
      lesson.accessType === LessonAccessType.FREE ||
      (lesson.accessType === LessonAccessType.INHERIT &&
        lesson.course.accessType === CourseAccessType.FREE);

    if (!isFreeLesson) {
      throw new AppException(LessonError.VIDEO_ACCESS_DENIED);
    }

    return true;
  }
}
