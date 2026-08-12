import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../repositories/user-repository.port';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}
  async executive(id: number) {
    const user = await this.userRepository.deleteUser(id);
    return UserMapper.toResponse(user);
  }
}
