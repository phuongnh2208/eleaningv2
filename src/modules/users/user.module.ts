import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from './user.service';

@Module({
  providers: [UserService, UserRepository],
  controllers: [UserController],
})
export class UserModule {}
