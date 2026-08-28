import {
  CourseAccessType,
  CourseStatus,
  LessonAccessType,
  Role,
  VideoProvider,
} from 'src/generated/prisma/client';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { VideoAccessGuard } from './video-access.guard';

const publishedCourse = {
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
};

const makeContext = (
  lessonId: string,
  role: Role,
  email = 'user@example.com',
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        params: { id: lessonId },
        user: { id: 20, role, email },
      }),
    }),
  }) as ExecutionContext;

const makeLesson = (accessType: LessonAccessType) => ({
  id: 1,
  courseId: 10,
  title: 'Lesson',
  description: null,
  position: 1,
  accessType,
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  course: publishedCourse,
  video: {
    id: 1,
    lessonId: 1,
    provider: VideoProvider.GOOGLE_DRIVE,
    driveFileId: 'drive-file',
    embedUrl: 'https://drive.google.com/file/d/drive-file/preview',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

describe('VideoAccessGuard', () => {
  it('allows an authenticated USER to view a free lesson video', async () => {
    const prisma = {
      enrollment: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      lesson: {
        findUnique: jest
          .fn()
          .mockResolvedValue(makeLesson(LessonAccessType.FREE)),
      },
    };
    const guard = new VideoAccessGuard(prisma as never);

    await expect(guard.canActivate(makeContext('1', Role.USER))).resolves.toBe(
      true,
    );
  });

  it('denies an authenticated USER from a paid inherited lesson', async () => {
    const prisma = {
      enrollment: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      lesson: {
        findUnique: jest.fn().mockResolvedValue({
          ...makeLesson(LessonAccessType.INHERIT),
          course: { ...publishedCourse, accessType: CourseAccessType.PAID },
        }),
      },
    };
    const guard = new VideoAccessGuard(prisma as never);

    await expect(
      guard.canActivate(makeContext('1', Role.USER)),
    ).rejects.toThrow();
  });

  it('allows ADMIN to view a paid lesson video', async () => {
    const prisma = {
      enrollment: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      lesson: {
        findUnique: jest.fn().mockResolvedValue({
          ...makeLesson(LessonAccessType.PAID),
          course: { ...publishedCourse, accessType: CourseAccessType.PAID },
        }),
      },
    };
    const guard = new VideoAccessGuard(prisma as never);

    await expect(guard.canActivate(makeContext('1', Role.ADMIN))).resolves.toBe(
      true,
    );
  });

  it('allows a USER with an active userId-based enrollment to view a paid lesson video (regression)', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      status: 'ACTIVE',
      expiresAt: null,
      userId: 20,
      contactEmail: null,
    });
    const prisma = {
      lesson: {
        findUnique: jest.fn().mockResolvedValue({
          ...makeLesson(LessonAccessType.INHERIT),
          course: { ...publishedCourse, accessType: CourseAccessType.PAID },
        }),
      },
      enrollment: { findFirst },
    };
    const guard = new VideoAccessGuard(prisma as never);

    await expect(
      guard.canActivate(makeContext('1', Role.USER, 'user@example.com')),
    ).resolves.toBe(true);

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({
          courseId: 10,
          OR: [{ userId: 20 }, { contactEmail: 'user@example.com' }],
        }),
      }),
    );
  });

  it('allows a USER whose Google-verified email matches a contact-based (public) enrollment', async () => {
    const prisma = {
      lesson: {
        findUnique: jest.fn().mockResolvedValue({
          ...makeLesson(LessonAccessType.INHERIT),
          course: { ...publishedCourse, accessType: CourseAccessType.PAID },
        }),
      },
      enrollment: {
        // Simulates a public-form enrollment: userId is null, matched by contactEmail.
        findFirst: jest.fn().mockResolvedValue({
          status: 'ACTIVE',
          expiresAt: null,
          userId: null,
          contactEmail: 'student@gmail.com',
        }),
      },
    };
    const guard = new VideoAccessGuard(prisma as never);

    await expect(
      guard.canActivate(makeContext('1', Role.USER, 'student@gmail.com')),
    ).resolves.toBe(true);
  });

  it('denies a USER whose enrollment has expired', async () => {
    const prisma = {
      lesson: {
        findUnique: jest.fn().mockResolvedValue({
          ...makeLesson(LessonAccessType.INHERIT),
          course: { ...publishedCourse, accessType: CourseAccessType.PAID },
        }),
      },
      enrollment: {
        findFirst: jest.fn().mockResolvedValue({
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() - 1000 * 60 * 60),
        }),
      },
    };
    const guard = new VideoAccessGuard(prisma as never);

    await expect(
      guard.canActivate(makeContext('1', Role.USER)),
    ).rejects.toThrow();
  });

  it('denies a USER without any enrollment on a paid lesson (403)', async () => {
    const prisma = {
      lesson: {
        findUnique: jest.fn().mockResolvedValue({
          ...makeLesson(LessonAccessType.INHERIT),
          course: { ...publishedCourse, accessType: CourseAccessType.PAID },
        }),
      },
      enrollment: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const guard = new VideoAccessGuard(prisma as never);

    await expect(
      guard.canActivate(makeContext('1', Role.USER)),
    ).rejects.toThrow();
  });

  it('denies an unpublished lesson even for ADMIN', async () => {
    const prisma = {
      enrollment: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      lesson: {
        findUnique: jest.fn().mockResolvedValue({
          ...makeLesson(LessonAccessType.FREE),
          isPublished: false,
        }),
      },
    };
    const guard = new VideoAccessGuard(prisma as never);

    await expect(
      guard.canActivate(makeContext('1', Role.ADMIN)),
    ).rejects.toThrow();
  });
});

describe('Free video route requires login (no public video tier)', () => {
  it('JwtAuthGuard rejects an anonymous request before VideoAccessGuard runs', () => {
    // GET /lessons/:id/video is decorated with @UseGuards(JwtAuthGuard, VideoAccessGuard).
    // An unauthenticated caller never reaches VideoAccessGuard: Passport's AuthGuard('jwt')
    // rejects with 401 when there is no (or an invalid) bearer token, which is exactly what
    // proves there is no more "public" video tier — see lesson.controller.ts.
    const guard = new JwtAuthGuard();
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      guard.handleRequest(null, false, null, {} as never),
    ).toThrow(UnauthorizedException);
  });
});
