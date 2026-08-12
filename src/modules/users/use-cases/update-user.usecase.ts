import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../repositories/user-repository.port';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { Role, Status } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from 'src/modules/auth/constants/auth.errors';
import { UserError } from '../constants/user.errors';
import { PasswordHasherStrategy } from 'src/common/secret/hashing/password-hasher.strategy';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
  ) {}
  async executive(
    currentUser: {
      id: number;
      email: string;
      role: Role;
      status: Status;
    },
    targetUserID: number,
    data: UpdateUserDto,
  ) {
    const isAdmin = currentUser.role === Role.ADMIN;
    const isOwner = currentUser.id === targetUserID;
    if (!isAdmin && !isOwner)
      throw new AppException(AuthError.CANNOT_UPDATE_OTHER_USER);

    if (!isAdmin) {
      if (data.role !== undefined)
        throw new AppException(AuthError.CANNOT_CHANGE_ROLE);
      if (data.status !== undefined)
        throw new AppException(AuthError.CANNOT_CHANGE_STATUS);
    }

    if (isAdmin && isOwner) {
      if (data.role !== undefined)
        throw new AppException(AuthError.CANNOT_CHANGE_OWN_ROLE);
      if (data.status !== undefined)
        throw new AppException(AuthError.CANNOT_CHANGE_OWN_STATUS);
    }

    const updateData: Partial<{
      email: string;
      passwordHash: string;
      role: Role;
      status: Status;
    }> = {};

    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) {
      const hashedPassword = await this.passwordHasherStrategy.hash(
        data.password,
      );
      updateData.passwordHash = hashedPassword;
    }
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    const user = await this.userRepository.updateUser(targetUserID, updateData);
    if (!user) throw new AppException(UserError.USER_NOT_FOUND);
    return UserMapper.toResponse(user);
  }
}
