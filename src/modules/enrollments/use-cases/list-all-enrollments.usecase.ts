import { Injectable } from '@nestjs/common';
import { EnrollmentMapper } from '../mappers/enrollment.mapper';
import { EnrollmentRepositoryPort } from '../repositories/enrollment-repository.port';

@Injectable()
export class ListAllEnrollmentsUseCase {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepositoryPort,
  ) {}

  async execute(status?: string) {
    const enrollments = await this.enrollmentRepository.findAll(status);
    return enrollments.map((enrollment) =>
      EnrollmentMapper.toResponse(enrollment),
    );
  }
}
