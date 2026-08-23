import { Injectable } from '@nestjs/common';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';
import { EnrollmentRepositoryPort } from '../repositories/enrollment-repository.port';

@Injectable()
export class ListMyEnrollmentsUseCase {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepositoryPort,
  ) {}

  async execute(userId: number) {
    const enrollments = await this.enrollmentRepository.findByUser(userId);
    return enrollments.map((enrollment) =>
      EnrollmentMapper.toResponse(enrollment),
    );
  }
}
