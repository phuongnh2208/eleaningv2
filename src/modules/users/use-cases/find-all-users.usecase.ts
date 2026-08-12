import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../repositories/user-repository.port';
import { UserMapper } from '../mappers/user.mapper';
import { Role, Status } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from 'src/modules/auth/constants/auth.errors';
import { QueryUserDt0 } from '../dto/query-users.dto';
import { UserQueryBuilder } from '../builders/user-query.builders';

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}
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
    const orderBy = queryBuilder.builderOrderBy();

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
        sortOrder: query.sortOrder,
      },
    };
  }
}
