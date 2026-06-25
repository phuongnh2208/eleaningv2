import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UpdateRepositoryInput } from 'src/modules/users/repositories/types/update-user-repository.input';
import { Role, Status } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from 'src/modules/auth/constants/auth.errors';
import { UserError } from '../constants/user.errors';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}
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
    if (!isAdmin && !isOwner) throw new AppException(AuthError.FORBIDDEN);
    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) updateData.passwordHash = data.password;
    if (isAdmin) {
      if (data.role !== undefined) updateData.role = data.role;
      if (data.status !== undefined) updateData.status = data.status;
    }
    // const updateData: UpdateRepositoryInput = {
    //   email: data.email,
    //   role: data.role,
    //   status: data.status,
    // };
    // if (data.password) updateData.passwordHash = data.password;
    const user = await this.userRepository.updateUser(targetUserID, updateData);
    if (!user) throw new AppException(UserError.USER_NOT_FOUND);
    return UserMapper.toResponse(user);
  }
}
