import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UpdateRepositoryInput } from 'src/modules/users/repositories/types/update-user-repository.input';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async executive(id: number, data: UpdateUserDto) {
    const updateData: UpdateRepositoryInput = {
      email: data.email,
      role: data.role,
      status: data.status,
    };
    if (data.password) updateData.passwordHash = data.password;
    const user = await this.userRepository.updateUser(id, updateData);
    return UserMapper.toResponse(user);
  }
}
