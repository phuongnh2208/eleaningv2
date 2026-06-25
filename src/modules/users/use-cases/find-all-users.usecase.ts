import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { Role, Status } from 'src/generated/prisma/enums';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from 'src/modules/auth/constants/auth.errors';

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async executive(currentUser: {
    id: number;
    email: string;
    role: Role;
    status: Status;
  }) {
    const isAdmin = currentUser.role === Role.ADMIN;
    if (!isAdmin) throw new AppException(AuthError.FORBIDDEN);
    const users = await this.userRepository.findAll();
    return users.map((user) => UserMapper.toResponse(user));
  }
}
