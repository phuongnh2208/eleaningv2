import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async executive() {
    const users = await this.userRepository.findAll();
    return users.map((user) => UserMapper.toResponse(user));
  }
}
