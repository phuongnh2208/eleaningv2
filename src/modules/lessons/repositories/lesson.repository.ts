import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CourseStatus, Prisma } from 'src/generated/prisma/client';
import {
  LessonData,
  LessonRepositoryPort,
  LessonWithRelations,
  VideoData,
} from './lesson-repository.port';

const lessonInclude = {
  course: true,
  video: true,
} satisfies Prisma.LessonInclude;

@Injectable()
export class LessonRepository extends LessonRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async courseExists(courseId: number): Promise<boolean> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    return course !== null;
  }

  async courseIsPublished(courseId: number): Promise<boolean> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { status: true },
    });
    return course?.status === CourseStatus.PUBLISHED;
  }

  async create(
    courseId: number,
    data: LessonData,
    video?: VideoData,
  ): Promise<LessonWithRelations> {
    return await this.prisma.lesson.create({
      data: {
        ...data,
        courseId,
        video: video ? { create: video } : undefined,
      },
      include: lessonInclude,
    });
  }

  async findById(id: number): Promise<LessonWithRelations | null> {
    return await this.prisma.lesson.findUnique({
      where: { id },
      include: lessonInclude,
    });
  }

  async findByCourseAndPosition(
    courseId: number,
    position: number,
  ): Promise<LessonWithRelations | null> {
    return await this.prisma.lesson.findUnique({
      where: {
        courseId_position: {
          courseId,
          position,
        },
      },
      include: lessonInclude,
    });
  }

  async findManyByCourse(
    courseId: number,
    includeUnpublished: boolean,
  ): Promise<LessonWithRelations[]> {
    return await this.prisma.lesson.findMany({
      where: {
        courseId,
        ...(includeUnpublished ? {} : { isPublished: true }),
      },
      orderBy: { position: 'asc' },
      include: lessonInclude,
    });
  }

  async update(
    id: number,
    data: Partial<LessonData>,
    video?: VideoData,
    removeVideo = false,
  ): Promise<LessonWithRelations | null> {
    return await this.prisma.$transaction(async (transaction) => {
      await transaction.lesson.update({
        where: { id },
        data,
      });

      if (removeVideo) {
        await transaction.video.deleteMany({ where: { lessonId: id } });
      }

      if (video) {
        await transaction.video.upsert({
          where: { lessonId: id },
          create: { lessonId: id, ...video },
          update: video,
        });
      }

      return await transaction.lesson.findUnique({
        where: { id },
        include: lessonInclude,
      });
    });
  }

  async delete(id: number): Promise<LessonWithRelations | null> {
    return await this.prisma.lesson.delete({
      where: { id },
      include: lessonInclude,
    });
  }
}
