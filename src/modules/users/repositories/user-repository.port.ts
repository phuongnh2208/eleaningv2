import { Prisma, User } from 'src/generated/prisma/client';
import { CreateUserRepositoryInput } from './types/create-user-repository.input';
import { UpdateUserRepositoryInput } from './types/update-user-repository.input';

export abstract class UserRepositoryPort {
  //   createUser(data: CreateUserRepositoryInput) {
  //     return await this.prisma.user.create({ data });
  //   }
  abstract createUser(data: CreateUserRepositoryInput): Promise<User>;
  //   findAll(params: Prisma.UserFindManyArgs = {}) {
  //     return await this.prisma.user.findMany(params);
  //   }
  abstract findAll(params?: Prisma.UserFindManyArgs): Promise<User[]>;
  //   count(where: any) {
  //     return await this.prisma.user.count({ where });
  //   }
  abstract count(where: Prisma.UserWhereInput): Promise<number>;
  //   findOne(id: number) {
  //     return await this.prisma.user.findUnique({
  //       where: { id },
  //     });
  //   }
  abstract findOne(id: number): Promise<User | null>;
  //   findByEmail(email: string) {
  //     return await this.prisma.user.findUnique({
  //       where: { email },
  //     });
  //   }
  abstract findByEmail(email: string): Promise<User | null>;
  //   updateUser(id: number, data: UpdateUserRepositoryInput) {
  //     return await this.prisma.user.update({
  //       where: { id },
  //       data,
  //     });
  //   }
  abstract updateUser(
    id: number,
    data: UpdateUserRepositoryInput,
  ): Promise<User>;
  //   deleteUser(id: number) {
  //     return await this.prisma.user.delete({ where: { id } });
  //   }
  abstract deleteUser(id: number): Promise<User>;
}
