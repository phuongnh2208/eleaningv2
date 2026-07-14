import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { CreateUserUseCase } from './use-cases/create-user.usecase';
import { FindAllUsersUseCase } from './use-cases/find-all-users.usecase';
import { FindUserByIdUseCase } from './use-cases/find-user-by-id.usecase';
import { UpdateUserUseCase } from './use-cases/update-user.usecase';
import { DeleteUserUseCase } from './use-cases/delete-user.usecase';
import { JwtStrategy } from '../auth/strategies/jwt/jwt.stratergy';
import { HashingModule } from 'src/common/secret/hashing/hashing.module';

@Module({
  providers: [
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindUserByIdUseCase,
    JwtStrategy,
    UpdateUserUseCase,
    DeleteUserUseCase,
    UserRepository,
  ],
  controllers: [UserController],
  imports: [HashingModule],
  exports: [UserRepository],
})
export class UserModule {}
