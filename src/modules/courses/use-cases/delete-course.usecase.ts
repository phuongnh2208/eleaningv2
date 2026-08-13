import { Injectable } from '@nestjs/common';
import { AppException } from 'src/common/exceptions/app.exception';
import { CourseError } from '../constants/course.errors';
import { CourseMapper } from '../mappers/course.mapper';
import { CourseRepositoryPort } from '../repositories/course-repository.port';

@Injectable()
export class DeleteCourseUseCase {
  constructor(private readonly courseRepository: CourseRepositoryPort) {}

  async execute(id: number) {
    const course = await this.courseRepository.delete(id);
    if (!course) {
      throw new AppException(CourseError.NOT_FOUND);
    }
    return CourseMapper.toResponse(course);
  }
}
