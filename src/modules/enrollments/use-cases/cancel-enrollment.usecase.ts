import { Injectable } from '@nestjs/common';
import { EnrollmentStatus, Role } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { EnrollmentError } from '../constants/enrollment.errors';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';
import { EnrollmentRepositoryPort } from '../repositories/enrollment-repository.port';

@Injectable()
export class CancelEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepositoryPort,
  ) {}

  async execute(
    actor: { id: number; role: Role; email?: string },
    enrollmentId: number,
  ) {
    const enrollment = await this.enrollmentRepository.findById(enrollmentId);
    if (!enrollment) {
      throw new AppException(EnrollmentError.NOT_FOUND);
    }

    const isAdmin = actor.role === Role.ADMIN;
    const isOwner =
      enrollment.userId !== null && enrollment.userId === actor.id;
    const isContactOwner =
      Boolean(actor.email) &&
      Boolean(enrollment.contactEmail) &&
      enrollment.contactEmail?.toLowerCase() === actor.email?.toLowerCase();

    if (!isAdmin && !isOwner && !isContactOwner) {
      throw new AppException(EnrollmentError.FORBIDDEN);
    }

    if (enrollment.status === EnrollmentStatus.CANCELLED) {
      throw new AppException(EnrollmentError.ALREADY_CANCELLED);
    }

    // Only admin can cancel active enrollments (e.g. revoke / refund), users cannot
    if (enrollment.status === EnrollmentStatus.ACTIVE && !isAdmin) {
      throw new AppException(EnrollmentError.CANNOT_CANCEL_ACTIVE);
    }

    const cancelled = await this.enrollmentRepository.cancel(enrollment.id);
    return EnrollmentMapper.toResponse(cancelled);
  }
}
