import { Injectable } from '@nestjs/common';
import {
  CourseAccessType,
  CourseStatus,
  Prisma,
} from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { CreateCourseDto } from '../dto/create-course.dto';
import { CourseError } from '../constants/course.errors';
import { CourseRepositoryPort } from '../repositories/course-repository.port';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class CreateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepositoryPort) {}

  async execute(currentUser: { id: number }, data: CreateCourseDto) {
    const slug = data.slug.trim().toLowerCase();
    const existing = await this.courseRepository.findBySlug(slug);
    if (existing) {
      throw new AppException(CourseError.SLUG_ALREADY_EXISTS);
    }

    this.validatePricing(data.accessType, data.price);

    const courseData: Prisma.CourseUncheckedCreateInput = {
      title: data.title.trim(),
      slug,
      description: data.description?.trim() || null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      accessType: data.accessType,
      price:
        data.accessType === CourseAccessType.PAID
          ? data.price!.toFixed(2)
          : null,
      currency: data.currency ?? 'VND',
      status: data.status ?? CourseStatus.DRAFT,
      createdById: currentUser.id,
    };

    const course = await this.courseRepository.create(courseData);
    return CourseMapper.toResponse(course);
  }

  private validatePricing(accessType: CourseAccessType, price?: number) {
    if (accessType === CourseAccessType.PAID && (!price || price <= 0)) {
      throw new AppException(CourseError.PAID_COURSE_REQUIRES_PRICE);
    }
    if (
      accessType === CourseAccessType.FREE &&
      price !== undefined &&
      price !== 0
    ) {
      throw new AppException(CourseError.FREE_COURSE_CANNOT_HAVE_PRICE);
    }
  }
}
