import { Injectable, Logger } from '@nestjs/common';
import {
  CourseAccessType,
  CourseStatus,
  Role,
} from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { CourseRepositoryPort } from 'src/modules/courses/repositories/course-repository.port';
import { EmailServicePort } from 'src/modules/email/email.service';
import { EnrollmentError } from '../constants/enrollment.errors';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';
import { EnrollmentRepositoryPort } from '../repositories/enrollment-repository.port';

export type EnrollmentActor = {
  id: number;
  email: string;
  role: Role;
};

@Injectable()
export class CreateEnrollmentUseCase {
  private readonly logger = new Logger(CreateEnrollmentUseCase.name);

  constructor(
    private readonly enrollmentRepository: EnrollmentRepositoryPort,
    private readonly courseRepository: CourseRepositoryPort,
    private readonly emailService: EmailServicePort,
  ) {}

  async execute(actor: EnrollmentActor, courseId: number) {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new AppException(EnrollmentError.COURSE_NOT_FOUND);
    }

    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new AppException(EnrollmentError.COURSE_NOT_FOUND);
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new AppException(EnrollmentError.COURSE_NOT_AVAILABLE);
    }

    const existing = await this.enrollmentRepository.findByUserAndCourse(
      actor.id,
      courseId,
    );
    if (existing?.status === 'ACTIVE') {
      throw new AppException(EnrollmentError.ALREADY_ENROLLED);
    }
    if (existing) {
      throw new AppException(EnrollmentError.ENROLLMENT_EXISTS);
    }

    const enrollment =
      course.accessType === CourseAccessType.FREE
        ? await this.enrollmentRepository.createFree(actor.id, courseId)
        : await this.enrollmentRepository.createPending(
            actor.id,
            courseId,
            course.price?.toString() ?? '0',
            course.currency,
          );

    await this.sendConfirmationEmail(enrollment, actor.email);

    return {
      enrollment: EnrollmentMapper.toResponse(enrollment),
      paymentRequired: course.accessType === CourseAccessType.PAID,
    };
  }

  private async sendConfirmationEmail(
    enrollment: Awaited<ReturnType<EnrollmentRepositoryPort['createFree']>>,
    recipient: string,
  ) {
    try {
      await this.emailService.sendEnrollmentConfirmation({
        recipient,
        courseTitle: enrollment.course.title,
        status: enrollment.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
        enrollmentId: enrollment.id,
      });
    } catch (error) {
      this.logger.warn(
        `Không thể gửi email enrollment ${enrollment.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
