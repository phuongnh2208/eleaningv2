import { Injectable } from '@nestjs/common';
import { AppException } from 'src/common/exceptions/app.exception';
import { LessonError } from '../constants/lesson.errors';
import { LessonMapper } from '../mappers/lesson.mapper';
import { LessonRepositoryPort } from '../repositories/lesson-repository.port';

@Injectable()
export class ListLessonsUseCase {
  constructor(private readonly lessonRepository: LessonRepositoryPort) {}

  async execute(courseId: number, adminMode = false) {
    if (!(await this.lessonRepository.courseExists(courseId))) {
      throw new AppException(LessonError.COURSE_NOT_FOUND);
    }

    if (
      !adminMode &&
      !(await this.lessonRepository.courseIsPublished(courseId))
    ) {
      throw new AppException(LessonError.COURSE_NOT_FOUND);
    }

    const lessons = await this.lessonRepository.findManyByCourse(
      courseId,
      adminMode,
    );

    return LessonMapper.toListResponse(lessons, adminMode);
  }
}
