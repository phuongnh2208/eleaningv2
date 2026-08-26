import {
  Enrollment,
  EnrollmentStatus,
  PaymentStatus,
  Prisma,
} from 'src/generated/prisma/client';

export type EnrollmentWithRelations = Enrollment & {
  user: { id: number; email: string } | null;
  course: {
    id: number;
    title: string;
    slug: string;
    accessType: string;
    price: Prisma.Decimal | null;
    currency: string;
    status: string;
  };
  payment: {
    id: number;
    status: PaymentStatus;
    amount: Prisma.Decimal;
    currency: string;
    externalReference: string | null;
    paidAt: Date | null;
  } | null;
};

export abstract class EnrollmentRepositoryPort {
  abstract findById(id: number): Promise<EnrollmentWithRelations | null>;
  abstract findByUserAndCourse(
    userId: number,
    courseId: number,
  ): Promise<EnrollmentWithRelations | null>;
  abstract findByUser(
    userId: number,
    email?: string,
  ): Promise<EnrollmentWithRelations[]>;
  abstract findAll(status?: string): Promise<EnrollmentWithRelations[]>;
  abstract createFree(
    userId: number,
    courseId: number,
  ): Promise<EnrollmentWithRelations>;
  abstract createPending(
    userId: number,
    courseId: number,
    amount: string,
    currency: string,
  ): Promise<EnrollmentWithRelations>;
  abstract activateWithPayment(
    enrollmentId: number,
    externalReference: string,
  ): Promise<EnrollmentWithRelations>;
  abstract cancel(enrollmentId: number): Promise<EnrollmentWithRelations>;
  abstract findActiveByCourseAndEmail(
    courseId: number,
    email: string,
  ): Promise<EnrollmentWithRelations | null>;
  abstract createPublicPending(input: {
    courseId: number;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    amount: string;
    currency: string;
  }): Promise<EnrollmentWithRelations>;
}

export type ActiveEnrollmentFilter = {
  status: EnrollmentStatus;
  expiresAt: { gt: Date } | null;
};
