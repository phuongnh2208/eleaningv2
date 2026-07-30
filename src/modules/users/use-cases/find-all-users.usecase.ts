/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Search } from '@nestjs/common';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { Role, Status } from 'src/generated/prisma/enums';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from 'src/modules/auth/constants/auth.errors';
import { QueryUserDt0 } from '../dto/query-users.dto';
import { contains } from 'class-validator';
import { filter } from 'rxjs';
import { SortOrder } from 'src/generated/prisma/internal/prismaNamespace';
import { UserQueryBuilder } from '../builders/user-query.builders';

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async executive(
    currentUser: {
      id: number;
      email: string;
      role: Role;
      status: Status;
    },
    query: QueryUserDt0,
  ) {
    const isAdmin = currentUser.role === Role.ADMIN;
    if (!isAdmin) throw new AppException(AuthError.FORBIDDEN);

    // build builder
    const queryBuilder = new UserQueryBuilder(query);

    // build where
    const where = queryBuilder.builderWhere();

    // build orderBy
    const orderBy = queryBuilder.builderWhere();

    // build pagination
    const pagination = queryBuilder.builderPagination();

    const users = await this.userRepository.findAll({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    });
    const total = await this.userRepository.count(where);
    return {
      data: users.map((user) => UserMapper.toResponse(user)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
      filter: {
        role: query.role,
        status: query.status,
        search: query.search,
      },
      sort: {
        sortBy: query.sortBy,
        SortOrder: query.sortOrder,
      },
    };
  }
}
