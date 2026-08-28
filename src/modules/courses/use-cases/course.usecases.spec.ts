import { CourseAccessType, CourseStatus } from 'src/generated/prisma/client';
import { CreateCourseUseCase } from './create-course.usecase';
import { UpdateCourseUseCase } from './update-course.usecase';

const course = {
  id: 1,
  title: 'NestJS Basic',
  slug: 'nestjs-basic',
  description: 'Course description',
  thumbnailUrl: null,
  driveFolderUrl: null,
  accessType: CourseAccessType.FREE,
  price: null,
  currency: 'VND',
  status: CourseStatus.DRAFT,
  createdById: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Course use cases', () => {
  it('creates a free course with normalized slug and null price', async () => {
    const repository = {
      findBySlug: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(course),
    };
    const useCase = new CreateCourseUseCase(repository as never);

    const response = await useCase.execute(
      { id: 10 },
      {
        title: ' NestJS Basic ',
        slug: 'NestJS-Basic',
        accessType: CourseAccessType.FREE,
        price: 0,
      },
    );

    expect(response.slug).toBe('nestjs-basic');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'NestJS Basic',
        slug: 'nestjs-basic',
        price: null,
        createdById: 10,
      }),
    );
  });

  it('rejects a paid course without a positive price', async () => {
    const repository = {
      findBySlug: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    const useCase = new CreateCourseUseCase(repository as never);

    await expect(
      useCase.execute(
        { id: 10 },
        {
          title: 'Paid course',
          slug: 'paid-course',
          accessType: CourseAccessType.PAID,
        },
      ),
    ).rejects.toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate slug on update', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(course),
      findBySlug: jest.fn().mockResolvedValue({ ...course, id: 2 }),
      update: jest.fn(),
    };
    const useCase = new UpdateCourseUseCase(repository as never);

    await expect(
      useCase.execute(1, { slug: 'another-course' }),
    ).rejects.toThrow();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
