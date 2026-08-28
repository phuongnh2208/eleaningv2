import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { CourseModule } from '../courses/course.module';
import { LessonModule } from '../lessons/lesson.module';
import { EmailModule } from '../email/email.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentRepository } from './repositories/enrollment.repository';
import { EnrollmentRepositoryPort } from './repositories/enrollment-repository.port';
import {
  MockPaymentGateway,
  PaymentGatewayPort,
} from './payment/payment-gateway';
import { ConfirmEnrollmentPaymentUseCase } from './use-cases/confirm-enrollment-payment.usecase';
import { CreateEnrollmentUseCase } from './use-cases/create-enrollment.usecase';
import { CreatePublicEnrollmentUseCase } from './use-cases/create-public-enrollment.usecase';
import { GetEnrollmentUseCase } from './use-cases/get-enrollment.usecase';
import { ListMyEnrollmentsUseCase } from './use-cases/list-my-enrollments.usecase';
import { ListAllEnrollmentsUseCase } from './use-cases/list-all-enrollments.usecase';
import { CancelEnrollmentUseCase } from './use-cases/cancel-enrollment.usecase';

@Module({
  imports: [PrismaModule, CourseModule, LessonModule, EmailModule],
  controllers: [EnrollmentController],
  providers: [
    CreateEnrollmentUseCase,
    CreatePublicEnrollmentUseCase,
    ConfirmEnrollmentPaymentUseCase,
    CancelEnrollmentUseCase,
    GetEnrollmentUseCase,
    ListMyEnrollmentsUseCase,
    ListAllEnrollmentsUseCase,
    EnrollmentRepository,
    {
      provide: EnrollmentRepositoryPort,
      useExisting: EnrollmentRepository,
    },
    MockPaymentGateway,
    {
      provide: PaymentGatewayPort,
      useExisting: MockPaymentGateway,
    },
    JwtAuthGuard,
  ],
  exports: [EnrollmentRepositoryPort],
})
export class EnrollmentModule {}
