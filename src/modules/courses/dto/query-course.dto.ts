import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CourseAccessType, CourseStatus } from 'src/generated/prisma/client';

export class QueryCourseDto {
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsEnum(CourseAccessType)
  accessType?: CourseAccessType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
