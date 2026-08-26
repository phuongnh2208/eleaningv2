import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from 'src/generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePublicEnrollmentDto } from './dto/create-public-enrollment.dto';
import { ConfirmEnrollmentPaymentUseCase } from './use-cases/confirm-enrollment-payment.usecase';
import { CreateEnrollmentUseCase } from './use-cases/create-enrollment.usecase';
import { CreatePublicEnrollmentUseCase } from './use-cases/create-public-enrollment.usecase';
import { GetEnrollmentUseCase } from './use-cases/get-enrollment.usecase';
import { ListMyEnrollmentsUseCase } from './use-cases/list-my-enrollments.usecase';
import { ListAllEnrollmentsUseCase } from './use-cases/list-all-enrollments.usecase';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    email: string;
    role: Role;
  };
};

@Controller('enrollments')
export class EnrollmentController {
  constructor(
    private readonly createEnrollmentUseCase: CreateEnrollmentUseCase,
    private readonly createPublicEnrollmentUseCase: CreatePublicEnrollmentUseCase,
    private readonly confirmPaymentUseCase: ConfirmEnrollmentPaymentUseCase,
    private readonly getEnrollmentUseCase: GetEnrollmentUseCase,
    private readonly listMyEnrollmentsUseCase: ListMyEnrollmentsUseCase,
    private readonly listAllEnrollmentsUseCase: ListAllEnrollmentsUseCase,
  ) {}

  // Public, anonymous intake form for the paid-enrollment-request flow
  // described in the presentation spec. No JWT required.
  @Post('public')
  async createPublic(@Body() body: CreatePublicEnrollmentDto) {
    return await this.createPublicEnrollmentUseCase.execute(body);
  }

  // Admin: list all enrollments (optionally filter by status)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  async listAll(@Query('status') status?: string) {
    return await this.listAllEnrollmentsUseCase.execute(status);
  }

  @UseGuards(JwtAuthGuard)
  @Post('courses/:courseId')
  async enroll(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return await this.createEnrollmentUseCase.execute(request.user, courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm-payment')
  async confirmPayment(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) enrollmentId: number,
  ) {
    return await this.confirmPaymentUseCase.execute(request.user, enrollmentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async listMine(@Req() request: AuthenticatedRequest) {
    return await this.listMyEnrollmentsUseCase.execute(
      request.user.id,
      request.user.email,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) enrollmentId: number,
  ) {
    return await this.getEnrollmentUseCase.execute(
      request.user.id,
      request.user.role,
      enrollmentId,
      request.user.email,
    );
  }
}
