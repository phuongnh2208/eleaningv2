import { Injectable } from '@nestjs/common';
import { AppException } from 'src/common/exceptions/app.exception';
import { LessonError } from '../constants/lesson.errors';
import { LessonMapper } from '../mappers/lesson.mapper';
import { LessonRepositoryPort } from '../repositories/lesson-repository.port';

@Injectable()
export class DeleteLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepositoryPort) {}

  async execute(id: number) {
    const lesson = await this.lessonRepository.delete(id);
    if (!lesson) {
      throw new AppException(LessonError.NOT_FOUND);
    }
    return LessonMapper.toResponse(lesson, true);
  }
}
