import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Course, Prisma } from 'src/generated/prisma/client';
import { CourseRepositoryPort } from './course-repository.port';

@Injectable()
export class CourseRepository extends CourseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: Prisma.CourseUncheckedCreateInput): Promise<Course> {
    return await this.prisma.course.create({ data });
  }

  async findById(id: number): Promise<Course | null> {
    return await this.prisma.course.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Course | null> {
    return await this.prisma.course.findUnique({ where: { slug } });
  }

  async findMany(params: Prisma.CourseFindManyArgs): Promise<Course[]> {
    return await this.prisma.course.findMany(params);
  }

  async count(where: Prisma.CourseWhereInput): Promise<number> {
    return await this.prisma.course.count({ where });
  }

  async update(
    id: number,
    data: Prisma.CourseUncheckedUpdateInput,
  ): Promise<Course | null> {
    return await this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Course | null> {
    return await this.prisma.course.delete({ where: { id } });
  }
}
