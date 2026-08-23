import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../repositories/user-repository.port';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { PasswordHasherStrategy } from 'src/common/secret/hashing/password-hasher.strategy';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly useRepository: UserRepositoryPort,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
  ) {}
  async executive(data: CreateUserDto) {
    const passwordHash = await this.passwordHasherStrategy.hash(data.password);
    const user = await this.useRepository.createUser({
      email: data.email,
      passwordHash,
      role: data.role,
    });
    return UserMapper.toResponse(user);
  }
}
