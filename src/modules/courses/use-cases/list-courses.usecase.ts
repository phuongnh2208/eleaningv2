import { Injectable } from '@nestjs/common';
import { CourseStatus, Prisma } from 'src/generated/prisma/client';
import { QueryCourseDto } from '../dto/query-course.dto';
import { CourseRepositoryPort } from '../repositories/course-repository.port';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class ListCoursesUseCase {
  constructor(private readonly courseRepository: CourseRepositoryPort) {}

  async execute(query: QueryCourseDto, adminMode = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.CourseWhereInput = {};

    if (adminMode) {
      if (query.status) where.status = query.status;
    } else {
      where.status = CourseStatus.PUBLISHED;
    }

    if (query.accessType) where.accessType = query.accessType;

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.courseRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.courseRepository.count(where),
    ]);

    return CourseMapper.toListResponse(courses, total, page, limit);
  }
}
