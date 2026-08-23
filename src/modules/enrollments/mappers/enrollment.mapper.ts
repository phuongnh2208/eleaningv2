import { EnrollmentWithRelations } from '../repositories/enrollment-repository.port';

export class EnrollmentMapper {
  static toResponse(enrollment: EnrollmentWithRelations) {
    return {
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      contactName: enrollment.contactName,
      contactEmail: enrollment.contactEmail,
      contactPhone: enrollment.contactPhone,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      activatedAt: enrollment.activatedAt,
      cancelledAt: enrollment.cancelledAt,
      expiresAt: enrollment.expiresAt,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
      user: enrollment.user,
      course: {
        ...enrollment.course,
        price: enrollment.course.price?.toString() ?? null,
      },
      payment: enrollment.payment
        ? {
            id: enrollment.payment.id,
            status: enrollment.payment.status,
            amount: enrollment.payment.amount.toString(),
            currency: enrollment.payment.currency,
            externalReference: enrollment.payment.externalReference,
            paidAt: enrollment.payment.paidAt,
          }
        : null,
    };
  }
}
