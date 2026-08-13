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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from 'src/generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { CreateCourseUseCase } from './use-cases/create-course.usecase';
import { DeleteCourseUseCase } from './use-cases/delete-course.usecase';
import { GetCourseUseCase } from './use-cases/get-course.usecase';
import { ListCoursesUseCase } from './use-cases/list-courses.usecase';
import { UpdateCourseUseCase } from './use-cases/update-course.usecase';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    email: string;
    role: Role;
  };
};

@Controller('courses')
export class CourseController {
  constructor(
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly deleteCourseUseCase: DeleteCourseUseCase,
    private readonly getCourseUseCase: GetCourseUseCase,
    private readonly listCoursesUseCase: ListCoursesUseCase,
    private readonly updateCourseUseCase: UpdateCourseUseCase,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  async listAdmin(@Query() query: QueryCourseDto) {
    return await this.listCoursesUseCase.execute(query, true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/:id')
  async getAdmin(@Param('id', ParseIntPipe) id: number) {
    return await this.getCourseUseCase.execute(id, true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateCourseDto,
  ) {
    return await this.createCourseUseCase.execute(request.user, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCourseDto,
  ) {
    return await this.updateCourseUseCase.execute(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.deleteCourseUseCase.execute(id);
  }

  @Get()
  async list(@Query() query: QueryCourseDto) {
    return await this.listCoursesUseCase.execute(query);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return await this.getCourseUseCase.execute(id);
  }
}
