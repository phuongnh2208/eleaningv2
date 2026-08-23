import {
  CourseAccessType,
  CourseStatus,
  EnrollmentStatus,
  PaymentStatus,
  Role,
} from 'src/generated/prisma/client';
import { ConfirmEnrollmentPaymentUseCase } from './confirm-enrollment-payment.usecase';
import { CreateEnrollmentUseCase } from './create-enrollment.usecase';
import { CreatePublicEnrollmentUseCase } from './create-public-enrollment.usecase';

const admin = {
  id: 1,
  email: 'admin@example.com',
  role: Role.ADMIN,
};

const actor = {
  id: 7,
  email: 'student@example.com',
  role: Role.USER,
};

const course = {
  id: 10,
  title: 'NestJS cơ bản',
  slug: 'nestjs-co-ban',
  description: null,
  thumbnailUrl: null,
  accessType: CourseAccessType.FREE,
  price: null,
  currency: 'VND',
  status: CourseStatus.PUBLISHED,
  createdById: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeEnrollment = (overrides: Record<string, unknown> = {}) => ({
  id: 100,
  userId: actor.id,
  courseId: course.id,
  status: EnrollmentStatus.ACTIVE,
  enrolledAt: new Date(),
  activatedAt: new Date(),
  cancelledAt: null,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: actor.id, email: actor.email },
  course: {
    id: course.id,
    title: course.title,
    slug: course.slug,
    accessType: course.accessType,
    price: course.price,
    currency: course.currency,
    status: course.status,
  },
  payment: null,
  ...overrides,
});

describe('Enrollment use cases', () => {
  it('creates an ACTIVE enrollment for a free published course', async () => {
    const enrollmentRepository = {
      findByUserAndCourse: jest.fn().mockResolvedValue(null),
      createFree: jest.fn().mockResolvedValue(makeEnrollment()),
    };
    const courseRepository = {
      findById: jest.fn().mockResolvedValue(course),
    };
    const emailService = {
      sendEnrollmentConfirmation: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new CreateEnrollmentUseCase(
      enrollmentRepository as never,
      courseRepository as never,
      emailService as never,
    );

    const result = await useCase.execute(actor, course.id);

    expect(enrollmentRepository.createFree).toHaveBeenCalledWith(
      actor.id,
      course.id,
    );
    expect(result.paymentRequired).toBe(false);
    expect(result.enrollment.status).toBe(EnrollmentStatus.ACTIVE);
    expect(emailService.sendEnrollmentConfirmation).toHaveBeenCalled();
  });

  it('creates a PENDING enrollment for a paid published course', async () => {
    const paidCourse = {
      ...course,
      accessType: CourseAccessType.PAID,
      price: { toString: () => '199000' },
    };
    const pendingEnrollment = makeEnrollment({
      status: EnrollmentStatus.PENDING,
      activatedAt: null,
      payment: {
        id: 200,
        status: PaymentStatus.PENDING,
        amount: { toString: () => '199000' },
        currency: 'VND',
        externalReference: null,
        paidAt: null,
      },
      course: {
        ...course,
        accessType: CourseAccessType.PAID,
        price: paidCourse.price,
      },
    });
    const enrollmentRepository = {
      findByUserAndCourse: jest.fn().mockResolvedValue(null),
      createPending: jest.fn().mockResolvedValue(pendingEnrollment),
    };
    const courseRepository = {
      findById: jest.fn().mockResolvedValue(paidCourse),
    };
    const emailService = {
      sendEnrollmentConfirmation: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new CreateEnrollmentUseCase(
      enrollmentRepository as never,
      courseRepository as never,
      emailService as never,
    );

    const result = await useCase.execute(actor, course.id);

    expect(enrollmentRepository.createPending).toHaveBeenCalledWith(
      actor.id,
      course.id,
      '199000',
      'VND',
    );
    expect(result.paymentRequired).toBe(true);
    expect(result.enrollment.status).toBe(EnrollmentStatus.PENDING);
  });

  it('activates a pending enrollment after a successful mock payment', async () => {
    const pending = makeEnrollment({
      status: EnrollmentStatus.PENDING,
      activatedAt: null,
      payment: {
        id: 200,
        status: PaymentStatus.PENDING,
        amount: { toString: () => '199000' },
        currency: 'VND',
        externalReference: null,
        paidAt: null,
      },
    });
    const active = makeEnrollment({
      payment: {
        id: 200,
        status: PaymentStatus.PAID,
        amount: { toString: () => '199000' },
        currency: 'VND',
        externalReference: 'MOCK-100-reference',
        paidAt: new Date(),
      },
    });
    const enrollmentRepository = {
      findById: jest.fn().mockResolvedValue(pending),
      activateWithPayment: jest.fn().mockResolvedValue(active),
    };
    const paymentGateway = {
      charge: jest.fn().mockResolvedValue({
        success: true,
        externalReference: 'MOCK-100-reference',
      }),
    };
    const emailService = {
      sendEnrollmentConfirmation: jest.fn().mockResolvedValue(undefined),
    };
    const lessonRepository = {
      findManyByCourse: jest.fn().mockResolvedValue([
        { id: 1, video: { driveFileId: 'drive-file-1' } },
        { id: 2, video: { driveFileId: 'drive-file-2' } },
        { id: 3, video: null },
      ]),
    };
    const driveAccessService = {
      grantAccess: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new ConfirmEnrollmentPaymentUseCase(
      enrollmentRepository as never,
      paymentGateway as never,
      emailService as never,
      lessonRepository as never,
      driveAccessService as never,
    );

    const result = await useCase.execute(actor, pending.id);

    expect(paymentGateway.charge).toHaveBeenCalledWith({
      enrollmentId: pending.id,
      amount: '199000',
      currency: 'VND',
    });
    expect(enrollmentRepository.activateWithPayment).toHaveBeenCalledWith(
      pending.id,
      'MOCK-100-reference',
    );
    expect(lessonRepository.findManyByCourse).toHaveBeenCalledWith(
      course.id,
      false,
    );
    expect(driveAccessService.grantAccess).toHaveBeenCalledWith(
      'drive-file-1',
      actor.email,
    );
    expect(driveAccessService.grantAccess).toHaveBeenCalledWith(
      'drive-file-2',
      actor.email,
    );
    expect(driveAccessService.grantAccess).toHaveBeenCalledTimes(2);
    expect(result.status).toBe(EnrollmentStatus.ACTIVE);
  });

  it('rejects creating a duplicate ACTIVE enrollment for the same user/course', async () => {
    const enrollmentRepository = {
      findByUserAndCourse: jest
        .fn()
        .mockResolvedValue(makeEnrollment({ status: EnrollmentStatus.ACTIVE })),
      createFree: jest.fn(),
    };
    const courseRepository = { findById: jest.fn().mockResolvedValue(course) };
    const emailService = { sendEnrollmentConfirmation: jest.fn() };
    const useCase = new CreateEnrollmentUseCase(
      enrollmentRepository as never,
      courseRepository as never,
      emailService as never,
    );

    await expect(useCase.execute(actor, course.id)).rejects.toThrow();
    expect(enrollmentRepository.createFree).not.toHaveBeenCalled();
  });

  it('rejects re-creating an already-existing PENDING enrollment', async () => {
    const enrollmentRepository = {
      findByUserAndCourse: jest
        .fn()
        .mockResolvedValue(
          makeEnrollment({ status: EnrollmentStatus.PENDING }),
        ),
      createFree: jest.fn(),
    };
    const courseRepository = { findById: jest.fn().mockResolvedValue(course) };
    const emailService = { sendEnrollmentConfirmation: jest.fn() };
    const useCase = new CreateEnrollmentUseCase(
      enrollmentRepository as never,
      courseRepository as never,
      emailService as never,
    );

    await expect(useCase.execute(actor, course.id)).rejects.toThrow();
  });

  it('rejects confirming payment for another user enrollment (not owner, not admin)', async () => {
    const pending = makeEnrollment({
      userId: 999,
      status: EnrollmentStatus.PENDING,
      payment: {
        id: 200,
        status: PaymentStatus.PENDING,
        amount: { toString: () => '199000' },
        currency: 'VND',
        externalReference: null,
        paidAt: null,
      },
    });
    const enrollmentRepository = {
      findById: jest.fn().mockResolvedValue(pending),
      activateWithPayment: jest.fn(),
    };
    const paymentGateway = { charge: jest.fn() };
    const emailService = { sendEnrollmentConfirmation: jest.fn() };
    const lessonRepository = {
      findManyByCourse: jest.fn().mockResolvedValue([]),
    };
    const driveAccessService = {
      grantAccess: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new ConfirmEnrollmentPaymentUseCase(
      enrollmentRepository as never,
      paymentGateway as never,
      emailService as never,
      lessonRepository as never,
      driveAccessService as never,
    );

    await expect(useCase.execute(actor, pending.id)).rejects.toThrow();
    expect(paymentGateway.charge).not.toHaveBeenCalled();
    expect(enrollmentRepository.activateWithPayment).not.toHaveBeenCalled();
  });

  it('does not undo the enrollment/payment state when confirmation email sending fails', async () => {
    const pending = makeEnrollment({
      status: EnrollmentStatus.PENDING,
      activatedAt: null,
      payment: {
        id: 200,
        status: PaymentStatus.PENDING,
        amount: { toString: () => '199000' },
        currency: 'VND',
        externalReference: null,
        paidAt: null,
      },
    });
    const active = makeEnrollment({
      payment: {
        id: 200,
        status: PaymentStatus.PAID,
        amount: { toString: () => '199000' },
        currency: 'VND',
        externalReference: 'MOCK-100-reference',
        paidAt: new Date(),
      },
    });
    const enrollmentRepository = {
      findById: jest.fn().mockResolvedValue(pending),
      activateWithPayment: jest.fn().mockResolvedValue(active),
    };
    const paymentGateway = {
      charge: jest.fn().mockResolvedValue({
        success: true,
        externalReference: 'MOCK-100-reference',
      }),
    };
    const emailService = {
      sendEnrollmentConfirmation: jest
        .fn()
        .mockRejectedValue(new Error('SMTP down')),
    };
    const lessonRepository = {
      findManyByCourse: jest.fn().mockResolvedValue([]),
    };
    const driveAccessService = {
      grantAccess: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new ConfirmEnrollmentPaymentUseCase(
      enrollmentRepository as never,
      paymentGateway as never,
      emailService as never,
      lessonRepository as never,
      driveAccessService as never,
    );

    const result = await useCase.execute(actor, pending.id);

    expect(result.status).toBe(EnrollmentStatus.ACTIVE);
    expect(enrollmentRepository.activateWithPayment).toHaveBeenCalledTimes(1);
  });
});

describe('Public (anonymous) enrollment use case', () => {
  const publicInput = {
    contactName: 'Nguyen Van A',
    contactEmail: 'student@gmail.com',
    contactPhone: '0912345678',
    courseId: course.id,
  };

  const makePublicEnrollment = (overrides: Record<string, unknown> = {}) => ({
    id: 300,
    userId: null,
    courseId: course.id,
    contactName: publicInput.contactName,
    contactEmail: publicInput.contactEmail,
    contactPhone: publicInput.contactPhone,
    status: EnrollmentStatus.PENDING,
    enrolledAt: new Date(),
    activatedAt: null,
    cancelledAt: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: null,
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      accessType: CourseAccessType.PAID,
      price: { toString: () => '199000' },
      currency: 'VND',
      status: course.status,
    },
    payment: {
      id: 400,
      status: PaymentStatus.PENDING,
      amount: { toString: () => '199000' },
      currency: 'VND',
      externalReference: null,
      paidAt: null,
    },
    ...overrides,
  });

  it('creates a PENDING enrollment with null userId + PENDING payment, and emails guidance', async () => {
    const paidCourse = {
      ...course,
      accessType: CourseAccessType.PAID,
      price: { toString: () => '199000' },
    };
    const enrollmentRepository = {
      createPublicPending: jest.fn().mockResolvedValue(makePublicEnrollment()),
    };
    const courseRepository = {
      findById: jest.fn().mockResolvedValue(paidCourse),
    };
    const emailService = {
      sendPublicEnrollmentGuidance: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new CreatePublicEnrollmentUseCase(
      enrollmentRepository as never,
      courseRepository as never,
      emailService as never,
    );

    const result = await useCase.execute(publicInput);

    expect(enrollmentRepository.createPublicPending).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: course.id,
        contactName: publicInput.contactName,
        contactEmail: publicInput.contactEmail,
        contactPhone: publicInput.contactPhone,
      }),
    );
    expect(result.enrollment.userId).toBeNull();
    expect(result.enrollment.status).toBe(EnrollmentStatus.PENDING);
    expect(emailService.sendPublicEnrollmentGuidance).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: publicInput.contactEmail }),
    );
  });

  it('rejects a public enrollment request for a FREE course', async () => {
    const enrollmentRepository = { createPublicPending: jest.fn() };
    const courseRepository = { findById: jest.fn().mockResolvedValue(course) }; // FREE
    const emailService = { sendPublicEnrollmentGuidance: jest.fn() };
    const useCase = new CreatePublicEnrollmentUseCase(
      enrollmentRepository as never,
      courseRepository as never,
      emailService as never,
    );

    await expect(useCase.execute(publicInput)).rejects.toThrow();
    expect(enrollmentRepository.createPublicPending).not.toHaveBeenCalled();
  });

  it('rejects a public enrollment request for a non-existent course', async () => {
    const enrollmentRepository = { createPublicPending: jest.fn() };
    const courseRepository = { findById: jest.fn().mockResolvedValue(null) };
    const emailService = { sendPublicEnrollmentGuidance: jest.fn() };
    const useCase = new CreatePublicEnrollmentUseCase(
      enrollmentRepository as never,
      courseRepository as never,
      emailService as never,
    );

    await expect(useCase.execute(publicInput)).rejects.toThrow();
    expect(enrollmentRepository.createPublicPending).not.toHaveBeenCalled();
  });

  it('lets an ADMIN confirm payment for a contact-based (userId: null) enrollment without an ownership check', async () => {
    const pending = makePublicEnrollment();
    const active = makePublicEnrollment({
      status: EnrollmentStatus.ACTIVE,
      activatedAt: new Date(),
      payment: {
        id: 400,
        status: PaymentStatus.PAID,
        amount: { toString: () => '199000' },
        currency: 'VND',
        externalReference: 'MOCK-300-reference',
        paidAt: new Date(),
      },
    });
    const enrollmentRepository = {
      findById: jest.fn().mockResolvedValue(pending),
      activateWithPayment: jest.fn().mockResolvedValue(active),
    };
    const paymentGateway = {
      charge: jest.fn().mockResolvedValue({
        success: true,
        externalReference: 'MOCK-300-reference',
      }),
    };
    const emailService = { sendEnrollmentConfirmation: jest.fn() };
    const lessonRepository = {
      findManyByCourse: jest.fn().mockResolvedValue([]),
    };
    const driveAccessService = {
      grantAccess: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new ConfirmEnrollmentPaymentUseCase(
      enrollmentRepository as never,
      paymentGateway as never,
      emailService as never,
      lessonRepository as never,
      driveAccessService as never,
    );

    const result = await useCase.execute(admin, pending.id);

    expect(result.status).toBe(EnrollmentStatus.ACTIVE);
    expect(enrollmentRepository.activateWithPayment).toHaveBeenCalledWith(
      pending.id,
      'MOCK-300-reference',
    );
  });

  it('rejects a non-ADMIN caller confirming payment for a contact-based (userId: null) enrollment', async () => {
    const pending = makePublicEnrollment();
    const enrollmentRepository = {
      findById: jest.fn().mockResolvedValue(pending),
      activateWithPayment: jest.fn(),
    };
    const paymentGateway = { charge: jest.fn() };
    const emailService = { sendEnrollmentConfirmation: jest.fn() };
    const lessonRepository = {
      findManyByCourse: jest.fn().mockResolvedValue([]),
    };
    const driveAccessService = {
      grantAccess: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new ConfirmEnrollmentPaymentUseCase(
      enrollmentRepository as never,
      paymentGateway as never,
      emailService as never,
      lessonRepository as never,
      driveAccessService as never,
    );

    await expect(useCase.execute(actor, pending.id)).rejects.toThrow();
    expect(paymentGateway.charge).not.toHaveBeenCalled();
    expect(enrollmentRepository.activateWithPayment).not.toHaveBeenCalled();
  });
});
