import { LessonWithRelations } from '../repositories/lesson-repository.port';

export type VideoResponse = {
  title: string;
  lessonId: number;
  driveFileId: string;
  embedUrl: string;
};

export class VideoMapper {
  static toResponse(lesson: LessonWithRelations): VideoResponse {
    if (!lesson.video || !lesson.video.driveFileId) {
      throw new Error('Lesson video is not configured');
    }

    return {
      title: lesson.title,
      lessonId: lesson.id,
      driveFileId: lesson.video.driveFileId,
      embedUrl: lesson.video.embedUrl,
    };
  }
}
