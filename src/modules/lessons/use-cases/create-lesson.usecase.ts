import { Injectable } from '@nestjs/common';
import { LessonAccessType, VideoProvider } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { LessonError } from '../constants/lesson.errors';
import { LessonMapper } from '../mappers/lesson.mapper';
import { LessonRepositoryPort } from '../repositories/lesson-repository.port';
import { GoogleDriveUrlUtil } from '../utils/google-drive-url.util';

@Injectable()
export class CreateLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepositoryPort) {}

  async execute(courseId: number, data: CreateLessonDto) {
    if (!(await this.lessonRepository.courseExists(courseId))) {
      throw new AppException(LessonError.COURSE_NOT_FOUND);
    }

    const positionOwner = await this.lessonRepository.findByCourseAndPosition(
      courseId,
      data.position,
    );
    if (positionOwner) {
      throw new AppException(LessonError.POSITION_ALREADY_EXISTS);
    }

    const video = data.videoUrl ? this.parseVideo(data.videoUrl) : undefined;
    const isPublished = data.isPublished ?? false;

    if (isPublished && !video) {
      throw new AppException(LessonError.PUBLISHED_LESSON_REQUIRES_VIDEO);
    }

    const lesson = await this.lessonRepository.create(
      courseId,
      {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        position: data.position,
        accessType: data.accessType ?? LessonAccessType.INHERIT,
        isPublished,
      },
      video,
    );

    return LessonMapper.toResponse(lesson, true);
  }

  private parseVideo(videoUrl: string) {
    const parsed = GoogleDriveUrlUtil.parse(videoUrl);
    if (!parsed) {
      throw new AppException(LessonError.VIDEO_URL_INVALID);
    }

    return {
      provider: VideoProvider.GOOGLE_DRIVE,
      externalId: parsed.externalId,
      embedUrl: parsed.embedUrl,
    };
  }
}
