import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/repositories/user.repository';
import { RegisterDto } from '../dto/register.dto';
import { UserMapper } from 'src/modules/users/mappers/user.mapper';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';

@Injectable()
export class RegisterUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async executive(data: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) throw new AppException(AuthError.EMAIL_ALREADY_EXISTS);
    const user = await this.userRepository.createUser({
      email: data.email,
      passwordHash: data.password,
    });
    return UserMapper.toResponse(user);
  }
}
