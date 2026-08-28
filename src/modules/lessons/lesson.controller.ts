import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { VideoAccessGuard } from './guards/video-access.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateLessonUseCase } from './use-cases/create-lesson.usecase';
import { DeleteLessonUseCase } from './use-cases/delete-lesson.usecase';
import { GetLessonUseCase } from './use-cases/get-lesson.usecase';
import { ListLessonsUseCase } from './use-cases/list-lessons.usecase';
import { UpdateLessonUseCase } from './use-cases/update-lesson.usecase';
import { ListDriveFolderVideosUseCase } from './use-cases/list-drive-folder-videos.usecase';

@Controller()
export class LessonController {
  constructor(
    private readonly createLessonUseCase: CreateLessonUseCase,
    private readonly deleteLessonUseCase: DeleteLessonUseCase,
    private readonly getLessonUseCase: GetLessonUseCase,
    private readonly listLessonsUseCase: ListLessonsUseCase,
    private readonly updateLessonUseCase: UpdateLessonUseCase,
    private readonly listDriveFolderVideosUseCase: ListDriveFolderVideosUseCase,
  ) {}

  @Get('courses/:courseId/lessons')
  async list(@Param('courseId', ParseIntPipe) courseId: number) {
    return await this.listLessonsUseCase.execute(courseId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('courses/:courseId/lessons/admin')
  async listAdmin(@Param('courseId', ParseIntPipe) courseId: number) {
    return await this.listLessonsUseCase.execute(courseId, true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('courses/:courseId/lessons')
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: CreateLessonDto,
  ) {
    return await this.createLessonUseCase.execute(courseId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('lessons/admin/:id')
  async getAdmin(@Param('id', ParseIntPipe) id: number) {
    return await this.getLessonUseCase.execute(id, true);
  }

  // Lists the video files inside a Google Drive folder so an admin can pick
  // several at once instead of copying each file's share link individually.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('lessons/drive-folder')
  async listDriveFolder(@Query('url') url: string) {
    return await this.listDriveFolderVideosUseCase.execute(url);
  }

  @UseGuards(JwtAuthGuard, VideoAccessGuard)
  @Get('lessons/:id/video')
  async getVideo(@Param('id', ParseIntPipe) id: number) {
    return await this.getLessonUseCase.execute(id, true);
  }

  @Get('lessons/:id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return await this.getLessonUseCase.execute(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('lessons/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLessonDto,
  ) {
    return await this.updateLessonUseCase.execute(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('lessons/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.deleteLessonUseCase.execute(id);
  }
}
