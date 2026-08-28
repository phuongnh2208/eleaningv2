import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  EnrollmentStatus,
  PaymentStatus,
  Prisma,
} from 'src/generated/prisma/client';
import {
  EnrollmentRepositoryPort,
  EnrollmentWithRelations,
} from './enrollment-repository.port';

const enrollmentInclude = {
  user: {
    select: {
      id: true,
      email: true,
    },
  },
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      accessType: true,
      price: true,
      currency: true,
      status: true,
    },
  },
  payment: {
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      externalReference: true,
      paidAt: true,
    },
  },
} satisfies Prisma.EnrollmentInclude;

@Injectable()
export class EnrollmentRepository extends EnrollmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: number): Promise<EnrollmentWithRelations | null> {
    return await this.prisma.enrollment.findUnique({
      where: { id },
      include: enrollmentInclude,
    });
  }

  async findByUserAndCourse(
    userId: number,
    courseId: number,
  ): Promise<EnrollmentWithRelations | null> {
    return await this.prisma.enrollment.findFirst({
      where: { userId, courseId },
      include: enrollmentInclude,
    });
  }

  async findActiveByCourseAndEmail(
    courseId: number,
    email: string,
  ): Promise<EnrollmentWithRelations | null> {
    return await this.prisma.enrollment.findFirst({
      where: {
        courseId,
        contactEmail: email,
        status: EnrollmentStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
      include: enrollmentInclude,
    });
  }

  async createPublicPending(input: {
    courseId: number;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    amount: string;
    currency: string;
  }): Promise<EnrollmentWithRelations> {
    return await this.prisma.enrollment.create({
      data: {
        courseId: input.courseId,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: EnrollmentStatus.PENDING,
        payment: {
          create: {
            status: PaymentStatus.PENDING,
            amount: input.amount,
            currency: input.currency,
          },
        },
      },
      include: enrollmentInclude,
    });
  }

  async findByUser(
    userId: number,
    email?: string,
  ): Promise<EnrollmentWithRelations[]> {
    return await this.prisma.enrollment.findMany({
      where: email
        ? {
            OR: [{ userId }, { contactEmail: email }],
          }
        : { userId },
      include: enrollmentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(status?: string): Promise<EnrollmentWithRelations[]> {
    return await this.prisma.enrollment.findMany({
      where: status ? { status: status as any } : undefined,
      include: enrollmentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFree(
    userId: number,
    courseId: number,
  ): Promise<EnrollmentWithRelations> {
    return await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
        activatedAt: new Date(),
      },
      include: enrollmentInclude,
    });
  }

  async createPending(
    userId: number,
    courseId: number,
    amount: string,
    currency: string,
  ): Promise<EnrollmentWithRelations> {
    return await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: EnrollmentStatus.PENDING,
        payment: {
          create: {
            status: PaymentStatus.PENDING,
            amount,
            currency,
          },
        },
      },
      include: enrollmentInclude,
    });
  }

  async activateWithPayment(
    enrollmentId: number,
    externalReference: string,
  ): Promise<EnrollmentWithRelations> {
    return await this.prisma.$transaction(async (transaction) => {
      await transaction.payment.update({
        where: { enrollmentId },
        data: {
          status: PaymentStatus.PAID,
          externalReference,
          paidAt: new Date(),
        },
      });

      return await transaction.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: EnrollmentStatus.ACTIVE,
          activatedAt: new Date(),
          cancelledAt: null,
        },
        include: enrollmentInclude,
      });
    });
  }

  async cancel(enrollmentId: number): Promise<EnrollmentWithRelations> {
    return await this.prisma.$transaction(async (transaction) => {
      await transaction.payment.updateMany({
        where: { enrollmentId, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      return await transaction.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: EnrollmentStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        include: enrollmentInclude,
      });
    });
  }
}
