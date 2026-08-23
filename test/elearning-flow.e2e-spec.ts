import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Status } from '../src/generated/prisma/client';
import { PasswordHasherStrategy } from '../src/common/secret/hashing/password-hasher.strategy';
import { GoogleIdTokenVerifierService } from '../src/modules/auth/services/google-id-token-verifier.service';

type LoginResponseBody = { accessToken: string };
type IdResponseBody = { id: number };
type CourseResponseBody = { id: number; accessType: string };
type VideoResponseBody = { video?: { embedUrl: string }; embedUrl?: string };
type EnrollResponseBody = {
  enrollment: { id: number; status: string };
  paymentRequired: boolean;
};
type EnrollmentResponseBody = { status: string };

/**
 * End-to-end flow across courses, lessons, enrollments and video access.
 *
 * Anyone can register/log in with email + password (LoginUseCase no longer
 * restricts by role); Google sign-in is also available standalone, and an
 * already-registered user can link a verified Google identity to their
 * account via POST /auth/link-google (needed for paid-video access checks
 * that match on the caller's Google-verified email). GoogleIdTokenVerifierService
 * is overridden here with a fake that maps known test tokens to fixed
 * profiles, so the Google-login and link-google flows can be exercised
 * without hitting real Google servers — the same pattern used at unit level
 * in google-login.usecase.spec.ts / link-google-account.usecase.spec.ts.
 */
describe('E-learning main flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const adminEmail = `admin-${suffix}@example.com`;
  const studentEmail = `student-${suffix}@example.com`;
  const outsiderEmail = `outsider-${suffix}@example.com`;
  const password = 'password123';

  const STUDENT_GOOGLE_TOKEN = `mock-google-token-student-${suffix}`;
  const mockGoogleProfiles: Record<
    string,
    { googleId: string; email: string }
  > = {
    [STUDENT_GOOGLE_TOKEN]: {
      googleId: `google-student-${suffix}`,
      email: studentEmail,
    },
  };

  let adminToken: string;
  let studentToken: string;
  let outsiderToken: string;

  let freeCourseId: number;
  let freeLessonId: number;
  let paidCourseId: number;
  let paidLessonId: number;
  let enrollmentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleIdTokenVerifierService)
      .useValue({
        verify: (idToken: string) => {
          const profile = mockGoogleProfiles[idToken];
          if (!profile) throw new Error('Unknown mock Google token');
          return Promise.resolve(profile);
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    // Bootstrap the one ADMIN account directly via Prisma (there is no
    // public way to mint the very first admin — expected, not a bug).
    const passwordHasher = moduleFixture.get(PasswordHasherStrategy);
    const passwordHash = await passwordHasher.hash(password);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        status: Status.ACTIVE,
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = (adminLogin.body as LoginResponseBody).accessToken;

    // Student and outsider register + log in with email/password, like any
    // regular user — no role restriction on this endpoint anymore.
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: studentEmail, password })
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: outsiderEmail, password })
      .expect(201);

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: studentEmail, password })
      .expect(201);
    studentToken = (studentLogin.body as LoginResponseBody).accessToken;

    const outsiderLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: outsiderEmail, password })
      .expect(201);
    outsiderToken = (outsiderLogin.body as LoginResponseBody).accessToken;
  });

  afterAll(async () => {
    if (!prisma) {
      if (app) await app.close();
      return;
    }
    // Best-effort cleanup of everything created by this run.
    const users = await prisma.user.findMany({
      where: { email: { in: [adminEmail, studentEmail, outsiderEmail] } },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length) {
      await prisma.payment.deleteMany({
        where: { enrollment: { userId: { in: userIds } } },
      });
      await prisma.enrollment.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    }
    if (freeCourseId) {
      await prisma.video.deleteMany({
        where: {
          lesson: {
            courseId: { in: [freeCourseId, paidCourseId].filter(Boolean) },
          },
        },
      });
      await prisma.lesson.deleteMany({
        where: {
          courseId: { in: [freeCourseId, paidCourseId].filter(Boolean) },
        },
      });
      await prisma.course.deleteMany({
        where: { id: { in: [freeCourseId, paidCourseId].filter(Boolean) } },
      });
    }
    if (userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await app.close();
  });

  it('shows no Google account linked right after email/password registration', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect((res.body as { hasGoogleAccount: boolean }).hasGoogleAccount).toBe(
      false,
    );
  });

  it('lets the logged-in student link a verified Google account without creating a new session', async () => {
    await request(app.getHttpServer())
      .post('/auth/link-google')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ idToken: STUDENT_GOOGLE_TOKEN })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect((res.body as { hasGoogleAccount: boolean }).hasGoogleAccount).toBe(
      true,
    );
  });

  it('admin creates a FREE course', async () => {
    const res = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Free Course ${suffix}`,
        slug: `free-course-${suffix}`,
        accessType: 'FREE',
        status: 'PUBLISHED',
      })
      .expect(201);
    freeCourseId = (res.body as IdResponseBody).id;
    expect(freeCourseId).toBeGreaterThan(0);
  });

  it('admin creates a lesson with a Google Drive link on the free course', async () => {
    const res = await request(app.getHttpServer())
      .post(`/courses/${freeCourseId}/lessons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Intro lesson',
        position: 1,
        accessType: 'FREE',
        isPublished: true,
        videoUrl: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view',
      })
      .expect(201);
    freeLessonId = (res.body as IdResponseBody).id;
    expect(freeLessonId).toBeGreaterThan(0);
  });

  it('public GET sees the free published course and lesson', async () => {
    const courseRes = await request(app.getHttpServer())
      .get(`/courses/${freeCourseId}`)
      .expect(200);
    expect((courseRes.body as CourseResponseBody).accessType).toBe('FREE');

    const lessonRes = await request(app.getHttpServer())
      .get(`/lessons/${freeLessonId}`)
      .expect(200);
    expect((lessonRes.body as IdResponseBody).id).toBe(freeLessonId);
  });

  it('an authenticated user can call the private video endpoint for a free lesson without a 401', async () => {
    const res = await request(app.getHttpServer())
      .get(`/lessons/${freeLessonId}/video`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    const body = res.body as VideoResponseBody;
    expect(body.video?.embedUrl ?? body.embedUrl).toBeTruthy();
  });

  it('rejects the private video endpoint with 401 when unauthenticated', async () => {
    await request(app.getHttpServer())
      .get(`/lessons/${freeLessonId}/video`)
      .expect(401);
  });

  it('admin creates a PAID course with a lesson', async () => {
    const courseRes = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Paid Course ${suffix}`,
        slug: `paid-course-${suffix}`,
        accessType: 'PAID',
        price: 199000,
        currency: 'VND',
        status: 'PUBLISHED',
      })
      .expect(201);
    paidCourseId = (courseRes.body as IdResponseBody).id;

    const lessonRes = await request(app.getHttpServer())
      .post(`/courses/${paidCourseId}/lessons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Paid lesson',
        position: 1,
        accessType: 'INHERIT',
        isPublished: true,
        videoUrl: 'https://drive.google.com/file/d/1PaIdLeSsOnIdXyZ/view',
      })
      .expect(201);
    paidLessonId = (lessonRes.body as IdResponseBody).id;
  });

  it('user enrolls in the paid course as PENDING (no immediate video access)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/enrollments/courses/${paidCourseId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);

    const body = res.body as EnrollResponseBody;
    enrollmentId = body.enrollment.id;
    expect(body.paymentRequired).toBe(true);
    expect(body.enrollment.status).toBe('PENDING');

    await request(app.getHttpServer())
      .get(`/lessons/${paidLessonId}/video`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it("a non-owner cannot fetch someone else's enrollment (IDOR check)", async () => {
    await request(app.getHttpServer())
      .get(`/enrollments/${enrollmentId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });

  it('admin confirms the payment, activating the enrollment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/enrollments/${enrollmentId}/confirm-payment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect((res.body as EnrollmentResponseBody).status).toBe('ACTIVE');
  });

  it('the enrolled user now receives an embedUrl for the paid lesson video', async () => {
    const res = await request(app.getHttpServer())
      .get(`/lessons/${paidLessonId}/video`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    const body = res.body as VideoResponseBody;
    const embedUrl = body.video?.embedUrl ?? body.embedUrl;
    expect(embedUrl).toContain('drive.google.com');
  });

  it('a second, non-enrolled user gets 403 with no embedUrl leaked', async () => {
    const res = await request(app.getHttpServer())
      .get(`/lessons/${paidLessonId}/video`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('embedUrl');
    expect(body).not.toContain('drive.google.com');
  });
});
