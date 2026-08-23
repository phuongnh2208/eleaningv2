import { Injectable, Logger } from '@nestjs/common';
import { CourseAccessType, CourseStatus } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { CourseRepositoryPort } from 'src/modules/courses/repositories/course-repository.port';
import { EmailServicePort } from 'src/modules/email/email.service';
import { CreatePublicEnrollmentDto } from '../dto/create-public-enrollment.dto';
import { EnrollmentError } from '../constants/enrollment.errors';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';
import { EnrollmentRepositoryPort } from '../repositories/enrollment-repository.port';

@Injectable()
export class CreatePublicEnrollmentUseCase {
  private readonly logger = new Logger(CreatePublicEnrollmentUseCase.name);

  constructor(
    private readonly enrollmentRepository: EnrollmentRepositoryPort,
    private readonly courseRepository: CourseRepositoryPort,
    private readonly emailService: EmailServicePort,
  ) {}

  async execute(input: CreatePublicEnrollmentDto) {
    const course = await this.courseRepository.findById(input.courseId);
    if (!course) {
      throw new AppException(EnrollmentError.COURSE_NOT_FOUND);
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new AppException(EnrollmentError.COURSE_NOT_AVAILABLE);
    }

    // FREE courses are self-serve via the authenticated flow
    // (POST /enrollments/courses/:courseId). The public/anonymous intake
    // form is specifically for the paid-enrollment-request flow, so we
    // reject free courses here with a clear pointer rather than silently
    // creating a no-op enrollment for an email that has no account yet.
    if (course.accessType === CourseAccessType.FREE) {
      throw new AppException(EnrollmentError.FREE_COURSE_REQUIRES_LOGIN);
    }

    const enrollment = await this.enrollmentRepository.createPublicPending({
      courseId: course.id,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      amount: course.price?.toString() ?? '0',
      currency: course.currency,
    });

    try {
      await this.emailService.sendPublicEnrollmentGuidance({
        recipient: input.contactEmail,
        contactName: input.contactName,
        courseTitle: course.title,
        amount: enrollment.payment?.amount.toString() ?? '0',
        currency: enrollment.payment?.currency ?? course.currency,
        enrollmentId: enrollment.id,
      });
    } catch (error) {
      this.logger.warn(
        `Không thể gửi email hướng dẫn thanh toán cho enrollment ${enrollment.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      enrollment: EnrollmentMapper.toResponse(enrollment),
      paymentRequired: true,
    };
  }
}
