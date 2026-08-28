import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CourseAccessType, CourseStatus } from 'src/generated/prisma/client';

export class CreateCourseDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  driveFolderUrl?: string;

  @IsEnum(CourseAccessType)
  accessType!: CourseAccessType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
