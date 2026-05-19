import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/repositories/user.repository';
import { LoginDto } from '../dto/login.dto';
import { UserMapper } from 'src/modules/users/mappers/user.mapper';
import { AuthError } from '../constants/auth.errors';
import { AppException } from 'src/common/exceptions/app.exception';

@Injectable()
export class LoginUseCase {
  constructor(private readonly useRepository: UserRepository) {}
  async excutive(data: LoginDto) {
    const user = await this.useRepository.findByEmail(data.email);
    if (!user) throw new AppException(AuthError.INVALID_CREDENTIALS);
    const isPasswordCorrect = user.passwordHash === data.password;
    if (!isPasswordCorrect)
      throw new AppException(AuthError.INVALID_CREDENTIALS);
    return { user: UserMapper.toResponse(user) };
  }
}
