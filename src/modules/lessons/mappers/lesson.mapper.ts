import { LessonWithRelations } from '../repositories/lesson-repository.port';

export class LessonMapper {
  static toResponse(lesson: LessonWithRelations, includeVideo = false) {
    const response: Record<string, unknown> = {
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      description: lesson.description,
      position: lesson.position,
      accessType: lesson.accessType,
      isPublished: lesson.isPublished,
      hasVideo: Boolean(lesson.video),
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };

    if (includeVideo && lesson.video) {
      response.video = {
        provider: lesson.video.provider,
        driveFileId: lesson.video.driveFileId,
        embedUrl: lesson.video.embedUrl,
      };
    }

    return response;
  }

  static toListResponse(lessons: LessonWithRelations[], includeVideo = false) {
    return lessons.map((lesson) => this.toResponse(lesson, includeVideo));
  }
}
