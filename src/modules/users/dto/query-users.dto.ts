import { IsOptional } from 'class-validator';
import { Role, Status } from 'src/generated/prisma/client';

export class QueryUserDt0 {
  @IsOptional()
  role?: Role;
  @IsOptional()
  status?: Status;
  @IsOptional()
  search?: string;
  @IsOptional()
  sortBy?: string;
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
  @IsOptional()
  page?: number;
  @IsOptional()
  limit?: number;
}
