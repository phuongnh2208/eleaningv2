import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { RegisterDto } from '../dto/register.dto';
import { UserMapper } from 'src/modules/users/mappers/user.mapper';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { PasswordHasherStrategy } from '../../../common/secret/hashing/password-hasher.strategy';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasherStrategy: PasswordHasherStrategy,
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


    //action 1
    //action 2
    /*
      1.event -- sự kiện
      2. dispatcher -- đặt chỗ
      3. listener -- lắng nghe
      

    */
    return UserMapper.toResponse(user);
  }
}
