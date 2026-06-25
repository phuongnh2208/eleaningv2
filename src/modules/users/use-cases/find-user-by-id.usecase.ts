import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { Role, Status } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from 'src/modules/auth/constants/auth.errors';

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly useRepository: UserRepository) {}
  async excutive(
    currenUser: {
      id: number;
      email: string;
      role: Role;
      status: Status;
    },
    targetUserID: number,
  ) {
    const isAdmin = currenUser.role === Role.ADMIN;
    const isOwner = currenUser.id === targetUserID;
    if (!isAdmin && !isOwner) throw new AppException(AuthError.FORBIDDEN);
    const user = await this.useRepository.findOne(targetUserID);
    return UserMapper.toResponse(user);
  }
}
