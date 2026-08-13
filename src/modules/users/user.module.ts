import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { CreateUserUseCase } from './use-cases/create-user.usecase';
import { FindAllUsersUseCase } from './use-cases/find-all-users.usecase';
import { FindUserByIdUseCase } from './use-cases/find-user-by-id.usecase';
import { UpdateUserUseCase } from './use-cases/update-user.usecase';
import { DeleteUserUseCase } from './use-cases/delete-user.usecase';
import { HashingModule } from 'src/common/secret/hashing/hashing.module';
import { LoggingUserRepositoryDecorator } from './repositories/logging-user-repository.decorator';
import { UserRepositoryPort } from './repositories/user-repository.port';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  providers: [
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    JwtAuthGuard,
    RolesGuard,
    UserRepository,
    {
      provide: UserRepositoryPort,
      useFactory: (repository: UserRepository) =>
        new LoggingUserRepositoryDecorator(repository),
      inject: [UserRepository],
    },
  ],
  controllers: [UserController],
  imports: [HashingModule],
  exports: [UserRepository, UserRepositoryPort],
})
export class UserModule {}
