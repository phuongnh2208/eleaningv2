import { Injectable } from '@nestjs/common';
import { VideoProvider } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { LessonError } from '../constants/lesson.errors';
import { LessonMapper } from '../mappers/lesson.mapper';
import { LessonRepositoryPort } from '../repositories/lesson-repository.port';
import { GoogleDriveUrlUtil } from '../utils/google-drive-url.util';

@Injectable()
export class UpdateLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepositoryPort) {}

  async execute(id: number, data: UpdateLessonDto) {
    const existing = await this.lessonRepository.findById(id);
    if (!existing) {
      throw new AppException(LessonError.NOT_FOUND);
    }

    if (data.position !== undefined && data.position !== existing.position) {
      const positionOwner = await this.lessonRepository.findByCourseAndPosition(
        existing.courseId,
        data.position,
      );
      if (positionOwner && positionOwner.id !== id) {
        throw new AppException(LessonError.POSITION_ALREADY_EXISTS);
      }
    }

    const video = data.videoUrl ? this.parseVideo(data.videoUrl) : undefined;
    const removeVideo = data.removeVideo === true && !data.videoUrl;
    const effectiveVideo = video ?? (removeVideo ? null : existing.video);

    const isPublished = data.isPublished ?? existing.isPublished;
    if (isPublished && !effectiveVideo) {
      throw new AppException(LessonError.PUBLISHED_LESSON_REQUIRES_VIDEO);
    }

    const updateData = {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description.trim() || null }
        : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
      ...(data.accessType !== undefined ? { accessType: data.accessType } : {}),
      ...(data.isPublished !== undefined
        ? { isPublished: data.isPublished }
        : {}),
    };

    const lesson = await this.lessonRepository.update(
      id,
      updateData,
      video,
      removeVideo,
    );

    if (!lesson) {
      throw new AppException(LessonError.NOT_FOUND);
    }

    return LessonMapper.toResponse(lesson, true);
  }

  private parseVideo(videoUrl: string) {
    const parsed = GoogleDriveUrlUtil.parse(videoUrl);
    if (!parsed) {
      throw new AppException(LessonError.VIDEO_URL_INVALID);
    }

    return {
      provider: VideoProvider.GOOGLE_DRIVE,
      driveFileId: parsed.driveFileId,
      embedUrl: parsed.embedUrl,
    };
  }
}
