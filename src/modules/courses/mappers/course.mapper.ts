import { Course } from 'src/generated/prisma/client';

export class CourseMapper {
  static toResponse(course: Course) {
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      accessType: course.accessType,
      price: course.price ? Number(course.price.toString()) : null,
      currency: course.currency,
      status: course.status,
      createdById: course.createdById,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  static toListResponse(
    courses: Course[],
    total: number,
    page: number,
    limit: number,
  ) {
    return {
      data: courses.map((course) => this.toResponse(course)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
