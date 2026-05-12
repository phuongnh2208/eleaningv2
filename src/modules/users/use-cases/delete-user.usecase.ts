import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async executive(id: number) {
    const user = await this.userRepository.deleteUser(id);
    return UserMapper.toResponse(user);
  }
}
