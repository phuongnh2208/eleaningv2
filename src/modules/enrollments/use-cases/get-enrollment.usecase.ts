import { Injectable } from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { EnrollmentError } from '../constants/enrollment.errors';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';
import { EnrollmentRepositoryPort } from '../repositories/enrollment-repository.port';

@Injectable()
export class GetEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepositoryPort,
  ) {}

  async execute(
    actorId: number,
    actorRole: Role,
    enrollmentId: number,
    actorEmail?: string,
  ) {
    if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) {
      throw new AppException(EnrollmentError.INVALID_ID);
    }

    const enrollment = await this.enrollmentRepository.findById(enrollmentId);
    if (!enrollment) {
      throw new AppException(EnrollmentError.NOT_FOUND);
    }

    const isOwner =
      enrollment.userId === actorId ||
      (actorEmail && enrollment.contactEmail === actorEmail);

    if (actorRole !== Role.ADMIN && !isOwner) {
      throw new AppException(EnrollmentError.FORBIDDEN);
    }

    return EnrollmentMapper.toResponse(enrollment);
  }
}
