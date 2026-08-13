import {
  LessonAccessType,
  Prisma,
  VideoProvider,
} from 'src/generated/prisma/client';

export type LessonData = {
  title: string;
  description: string | null;
  position: number;
  accessType: LessonAccessType;
  isPublished: boolean;
};

export type VideoData = {
  provider: VideoProvider;
  externalId: string | null;
  embedUrl: string;
};

export type LessonWithRelations = Prisma.LessonGetPayload<{
  include: {
    course: true;
    video: true;
  };
}>;

export abstract class LessonRepositoryPort {
  abstract courseExists(courseId: number): Promise<boolean>;
  abstract courseIsPublished(courseId: number): Promise<boolean>;
  abstract create(
    courseId: number,
    data: LessonData,
    video?: VideoData,
  ): Promise<LessonWithRelations>;
  abstract findById(id: number): Promise<LessonWithRelations | null>;
  abstract findByCourseAndPosition(
    courseId: number,
    position: number,
  ): Promise<LessonWithRelations | null>;
  abstract findManyByCourse(
    courseId: number,
    includeUnpublished: boolean,
  ): Promise<LessonWithRelations[]>;
  abstract update(
    id: number,
    data: Partial<LessonData>,
    video?: VideoData,
    removeVideo?: boolean,
  ): Promise<LessonWithRelations | null>;
  abstract delete(id: number): Promise<LessonWithRelations | null>;
}
