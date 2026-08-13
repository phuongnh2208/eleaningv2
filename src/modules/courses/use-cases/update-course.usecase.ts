import { Injectable } from '@nestjs/common';
import { CourseAccessType, Prisma } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CourseError } from '../constants/course.errors';
import { CourseRepositoryPort } from '../repositories/course-repository.port';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class UpdateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepositoryPort) {}

  async execute(id: number, data: UpdateCourseDto) {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      throw new AppException(CourseError.NOT_FOUND);
    }

    const nextSlug = data.slug?.trim().toLowerCase();
    if (nextSlug && nextSlug !== existing.slug) {
      const slugOwner = await this.courseRepository.findBySlug(nextSlug);
      if (slugOwner && slugOwner.id !== id) {
        throw new AppException(CourseError.SLUG_ALREADY_EXISTS);
      }
    }

    const nextAccessType = data.accessType ?? existing.accessType;
    const existingPrice = existing.price
      ? Number(existing.price.toString())
      : undefined;
    const nextPrice = data.price !== undefined ? data.price : existingPrice;

    this.validatePricing(nextAccessType, nextPrice);

    const updateData: Prisma.CourseUncheckedUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (nextSlug !== undefined) updateData.slug = nextSlug;
    if (data.description !== undefined)
      updateData.description = data.description.trim() || null;
    if (data.thumbnailUrl !== undefined)
      updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.accessType !== undefined) updateData.accessType = data.accessType;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.status !== undefined) updateData.status = data.status;

    if (nextAccessType === CourseAccessType.PAID) {
      updateData.price = nextPrice!.toFixed(2);
    } else if (data.accessType !== undefined || data.price !== undefined) {
      updateData.price = null;
    }

    const course = await this.courseRepository.update(id, updateData);
    if (!course) {
      throw new AppException(CourseError.NOT_FOUND);
    }

    return CourseMapper.toResponse(course);
  }

  private validatePricing(accessType: CourseAccessType, price?: number | null) {
    if (accessType === CourseAccessType.PAID && (!price || price <= 0)) {
      throw new AppException(CourseError.PAID_COURSE_REQUIRES_PRICE);
    }
    if (
      accessType === CourseAccessType.FREE &&
      price !== undefined &&
      price !== null &&
      price !== 0
    ) {
      throw new AppException(CourseError.FREE_COURSE_CANNOT_HAVE_PRICE);
    }
  }
}
