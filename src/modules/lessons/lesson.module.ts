import { Module } from '@nestjs/common';
import { LessonController } from './lesson.controller';
import { LessonRepository } from './repositories/lesson.repository';
import { LessonRepositoryPort } from './repositories/lesson-repository.port';
import { CreateLessonUseCase } from './use-cases/create-lesson.usecase';
import { DeleteLessonUseCase } from './use-cases/delete-lesson.usecase';
import { GetLessonUseCase } from './use-cases/get-lesson.usecase';
import { ListLessonsUseCase } from './use-cases/list-lessons.usecase';
import { UpdateLessonUseCase } from './use-cases/update-lesson.usecase';
import { VideoAccessGuard } from './guards/video-access.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DriveAccessService } from './services/drive-access.service';
import { ListDriveFolderVideosUseCase } from './use-cases/list-drive-folder-videos.usecase';

@Module({
  providers: [
    CreateLessonUseCase,
    DeleteLessonUseCase,
    GetLessonUseCase,
    ListLessonsUseCase,
    UpdateLessonUseCase,
    VideoAccessGuard,
    JwtAuthGuard,
    RolesGuard,
    LessonRepository,
    {
      provide: LessonRepositoryPort,
      useClass: LessonRepository,
    },
    DriveAccessService,
    ListDriveFolderVideosUseCase,
  ],
  controllers: [LessonController],
  exports: [LessonRepository, LessonRepositoryPort, DriveAccessService],
})
export class LessonModule {}
