import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { LessonAccessType } from 'src/generated/prisma/client';

export class CreateLessonDto {
  @IsString()
  title!: string;

  @IsNumber()
  @Min(1)
  position!: number;

  @IsEnum(LessonAccessType)
  accessType!: LessonAccessType;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}
