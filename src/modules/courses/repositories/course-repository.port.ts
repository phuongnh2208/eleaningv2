import { Course, Prisma } from 'src/generated/prisma/client';

export abstract class CourseRepositoryPort {
  abstract create(data: Prisma.CourseUncheckedCreateInput): Promise<Course>;
  abstract findById(id: number): Promise<Course | null>;
  abstract findBySlug(slug: string): Promise<Course | null>;
  abstract findMany(params: Prisma.CourseFindManyArgs): Promise<Course[]>;
  abstract count(where: Prisma.CourseWhereInput): Promise<number>;
  abstract update(
    id: number,
    data: Prisma.CourseUncheckedUpdateInput,
  ): Promise<Course | null>;
  abstract delete(id: number): Promise<Course | null>;
}
