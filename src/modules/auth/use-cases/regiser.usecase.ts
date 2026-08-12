import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from 'src/modules/users/repositories/user-repository.port';
import { RegisterDto } from '../dto/register.dto';
import { UserMapper } from 'src/modules/users/mappers/user.mapper';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { PasswordHasherStrategy } from '../../../common/secret/hashing/password-hasher.strategy';
import { EventDispatcher } from 'src/common/events/event-dispatcher';
import { UserRegisteredEvent } from '../events/user-registered.event';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
    private readonly eventDispatcher: EventDispatcher,
  ) {}
  async executive(data: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) throw new AppException(AuthError.EMAIL_ALREADY_EXISTS);
    const passwordHasher = await this.passwordHasherStrategy.hash(
      data.password,
    );
    const user = await this.userRepository.createUser({
      email: data.email,
      passwordHash: passwordHasher,
    });

    await this.eventDispatcher.dispatch(new UserRegisteredEvent(user));
    return UserMapper.toResponse(user);
  }
}
