import { Injectable, Logger } from '@nestjs/common';
import {
  Role,
  EnrollmentStatus,
  PaymentStatus,
} from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { EmailServicePort } from 'src/modules/email/email.service';
import { EnrollmentError } from '../constants/enrollment.errors';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';
import { EnrollmentRepositoryPort } from '../repositories/enrollment-repository.port';
import { PaymentGatewayPort } from '../payment/payment-gateway';
import { LessonRepositoryPort } from 'src/modules/lessons/repositories/lesson-repository.port';
import { DriveAccessService } from 'src/modules/lessons/services/drive-access.service';

export type PaymentActor = {
  id: number;
  email: string;
  role: Role;
};

@Injectable()
export class ConfirmEnrollmentPaymentUseCase {
  private readonly logger = new Logger(ConfirmEnrollmentPaymentUseCase.name);

  constructor(
    private readonly enrollmentRepository: EnrollmentRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly emailService: EmailServicePort,
    private readonly lessonRepository: LessonRepositoryPort,
    private readonly driveAccessService: DriveAccessService,
  ) {}

  async execute(actor: PaymentActor, enrollmentId: number) {
    if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) {
      throw new AppException(EnrollmentError.INVALID_ID);
    }

    const enrollment = await this.enrollmentRepository.findById(enrollmentId);
    if (!enrollment) {
      throw new AppException(EnrollmentError.NOT_FOUND);
    }

    if (enrollment.userId === null) {
      // Contact-based (public form) enrollments have no owning user yet —
      // only an admin can confirm payment for these.
      if (actor.role !== Role.ADMIN) {
        throw new AppException(EnrollmentError.FORBIDDEN);
      }
    } else if (actor.role !== Role.ADMIN && enrollment.userId !== actor.id) {
      throw new AppException(EnrollmentError.FORBIDDEN);
    }

    if (enrollment.status === EnrollmentStatus.ACTIVE) {
      throw new AppException(EnrollmentError.PAYMENT_ALREADY_PROCESSED);
    }

    if (!enrollment.payment) {
      throw new AppException(EnrollmentError.PAYMENT_NOT_FOUND);
    }

    if (enrollment.payment.status === PaymentStatus.PAID) {
      throw new AppException(EnrollmentError.PAYMENT_ALREADY_PROCESSED);
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new AppException(EnrollmentError.PAYMENT_FAILED);
    }

    const result = await this.paymentGateway.charge({
      enrollmentId: enrollment.id,
      amount: enrollment.payment.amount.toString(),
      currency: enrollment.payment.currency,
    });

    if (!result.success) {
      throw new AppException(EnrollmentError.PAYMENT_FAILED);
    }

    const activated = await this.enrollmentRepository.activateWithPayment(
      enrollment.id,
      result.externalReference,
    );

    const recipient = activated.user?.email ?? activated.contactEmail;

    if (recipient) {
      try {
        const lessons = await this.lessonRepository.findManyByCourse(
          activated.courseId,
          false,
        );
        await Promise.all(
          lessons
            .filter((lesson) => lesson.video?.driveFileId)
            .map((lesson) =>
              this.driveAccessService.grantAccess(
                lesson.video!.driveFileId!,
                recipient,
              ),
            ),
        );
      } catch (error) {
        // Drive-level sharing is an additive hardening layer on top of the
        // mandatory VideoAccessGuard check — a failure here must not undo
        // the payment/enrollment activation that already happened above.
        this.logger.warn(
          `Không thể cấp quyền Google Drive cho enrollment ${activated.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    try {
      if (recipient) {
        await this.emailService.sendEnrollmentConfirmation({
          recipient,
          courseTitle: activated.course.title,
          status: 'ACTIVE',
          enrollmentId: activated.id,
          paymentReference: result.externalReference,
        });
      }
    } catch (error) {
      this.logger.warn(
        `Không thể gửi email kích hoạt enrollment ${activated.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return EnrollmentMapper.toResponse(activated);
  }
}
