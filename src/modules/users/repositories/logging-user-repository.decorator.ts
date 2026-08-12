import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/generated/prisma/client';
import { CreateUserRepositoryInput } from './types/create-user-repository.input';
import { UserRepositoryPort } from './user-repository.port';
import { UserFindManyArgs, UserWhereInput } from 'src/generated/prisma/models';
import { UpdateUserRepositoryInput } from './types/update-user-repository.input';
import { UserRepository } from './user.repository';

@Injectable()
export class LoggingUserRepositoryDecorator extends UserRepositoryPort {
  private readonly logger = new Logger(LoggingUserRepositoryDecorator.name);

  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async createUser(data: CreateUserRepositoryInput): Promise<User> {
    this.logger.log(
      `[${new Date().toISOString()}] create user called with email = ${data.email}`,
    );
    return this.userRepository.createUser(data);
  }

  async findAll(params?: UserFindManyArgs): Promise<User[]> {
    this.logger.log(`[${new Date().toISOString()}] findAll users called`);
    return this.userRepository.findAll(params);
  }

  async count(where: UserWhereInput): Promise<number> {
    this.logger.log(`[${new Date().toISOString()}] count users called`);
    return this.userRepository.count(where);
  }

  async findOne(id: number): Promise<User | null> {
    this.logger.log(
      `[${new Date().toISOString()}] findOne user called with id = ${id}`,
    );
    return this.userRepository.findOne(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(
      `[${new Date().toISOString()}] findByEmail user called with email = ${email}`,
    );
    return this.userRepository.findByEmail(email);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    this.logger.log(
      `[${new Date().toISOString()}] findByGoogleId user called with googleId = ${googleId}`,
    );
    return this.userRepository.findByGoogleId(googleId);
  }

  async updateUser(id: number, data: UpdateUserRepositoryInput): Promise<User> {
    this.logger.log(
      `[${new Date().toISOString()}] update user called with id = ${id}`,
    );
    return this.userRepository.updateUser(id, data);
  }

  async deleteUser(id: number): Promise<User> {
    this.logger.log(
      `[${new Date().toISOString()}] delete user called with id = ${id}`,
    );
    return this.userRepository.deleteUser(id);
  }
}
