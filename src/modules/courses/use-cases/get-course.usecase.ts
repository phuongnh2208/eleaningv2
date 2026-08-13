import { Injectable } from '@nestjs/common';
import { CourseStatus } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { CourseError } from '../constants/course.errors';
import { CourseRepositoryPort } from '../repositories/course-repository.port';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class GetCourseUseCase {
  constructor(private readonly courseRepository: CourseRepositoryPort) {}

  async execute(id: number, adminMode = false) {
    const course = await this.courseRepository.findById(id);
    if (!course || (!adminMode && course.status !== CourseStatus.PUBLISHED)) {
      throw new AppException(CourseError.NOT_FOUND);
    }
    return CourseMapper.toResponse(course);
  }
}
