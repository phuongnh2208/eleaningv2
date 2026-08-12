import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../repositories/user-repository.port';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly useRepository: UserRepositoryPort) {}
  async executive(data: CreateUserDto) {
    const user = await this.useRepository.createUser({
      email: data.email,
      passwordHash: data.password,
    });
    return UserMapper.toResponse(user);
  }
}
