import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CourseController } from './course.controller';
import { CourseRepository } from './repositories/course.repository';
import { CourseRepositoryPort } from './repositories/course-repository.port';
import { CreateCourseUseCase } from './use-cases/create-course.usecase';
import { DeleteCourseUseCase } from './use-cases/delete-course.usecase';
import { GetCourseUseCase } from './use-cases/get-course.usecase';
import { ListCoursesUseCase } from './use-cases/list-courses.usecase';
import { UpdateCourseUseCase } from './use-cases/update-course.usecase';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CourseController],
  providers: [
    CreateCourseUseCase,
    DeleteCourseUseCase,
    GetCourseUseCase,
    ListCoursesUseCase,
    UpdateCourseUseCase,
    JwtAuthGuard,
    RolesGuard,
    CourseRepository,
    {
      provide: CourseRepositoryPort,
      useExisting: CourseRepository,
    },
  ],
  exports: [CourseRepositoryPort],
})
export class CourseModule {}
