import {
  CourseAccessType,
  CourseStatus,
  LessonAccessType,
  VideoProvider,
} from 'src/generated/prisma/client';
import { LessonWithRelations } from '../repositories/lesson-repository.port';
import { CreateLessonUseCase } from './create-lesson.usecase';
import { UpdateLessonUseCase } from './update-lesson.usecase';
import { GoogleDriveUrlUtil } from '../utils/google-drive-url.util';

const lesson: LessonWithRelations = {
  id: 1,
  courseId: 10,
  title: 'Introduction',
  description: null,
  position: 1,
  accessType: LessonAccessType.INHERIT,
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  course: {
    id: 10,
    title: 'Course',
    slug: 'course',
    description: null,
    thumbnailUrl: null,
    driveFolderUrl: null,
    accessType: CourseAccessType.FREE,
    price: null,
    currency: 'VND',
    status: CourseStatus.PUBLISHED,
    createdById: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  video: {
    id: 2,
    lessonId: 1,
    provider: VideoProvider.GOOGLE_DRIVE,
    driveFileId: 'drive-file-1',
    embedUrl: 'https://drive.google.com/file/d/drive-file-1/preview',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe('GoogleDriveUrlUtil', () => {
  it('normalizes a Google Drive file URL to preview URL', () => {
    expect(
      GoogleDriveUrlUtil.parse(
        'https://drive.google.com/file/d/abc_123/view?usp=sharing',
      ),
    ).toEqual({
      driveFileId: 'abc_123',
      embedUrl: 'https://drive.google.com/file/d/abc_123/preview',
    });
  });

  it('rejects a non-Google-Drive URL', () => {
    expect(GoogleDriveUrlUtil.parse('https://example.com/video')).toBeNull();
  });
});

describe('Lesson use cases', () => {
  it('creates a published lesson with a normalized Google Drive video', async () => {
    const repository = {
      courseExists: jest.fn().mockResolvedValue(true),
      findByCourseAndPosition: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(lesson),
    };
    const useCase = new CreateLessonUseCase(repository as never);

    const response = await useCase.execute(10, {
      title: ' Introduction ',
      position: 1,
      accessType: LessonAccessType.INHERIT,
      isPublished: true,
      videoUrl: 'https://drive.google.com/file/d/drive-file-1/view',
    });

    const video = response.video as { embedUrl: string } | undefined;
    expect(video?.embedUrl).toContain('/drive-file-1/preview');
    expect(repository.create).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ title: 'Introduction', isPublished: true }),
      expect.objectContaining({
        provider: VideoProvider.GOOGLE_DRIVE,
        driveFileId: 'drive-file-1',
      }),
    );
  });

  it('rejects publishing a lesson without video', async () => {
    const repository = {
      courseExists: jest.fn().mockResolvedValue(true),
      findByCourseAndPosition: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    const useCase = new CreateLessonUseCase(repository as never);

    await expect(
      useCase.execute(10, {
        title: 'No video',
        position: 1,
        accessType: LessonAccessType.INHERIT,
        isPublished: true,
      }),
    ).rejects.toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects moving a lesson to an occupied position', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(lesson),
      findByCourseAndPosition: jest
        .fn()
        .mockResolvedValue({ ...lesson, id: 2 }),
      update: jest.fn(),
    };
    const useCase = new UpdateLessonUseCase(repository as never);

    await expect(useCase.execute(1, { position: 2 })).rejects.toThrow();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
