import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserRepositoryInput } from './types/create-user-repository.input';
import { UpdateUserRepositoryInput } from './types/update-user-repository.input';
import { Prisma } from 'src/generated/prisma/client';
import { UserRepositoryPort } from './user-repository.port';

@Injectable()
export class UserRepository extends UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async createUser(data: CreateUserRepositoryInput) {
    return await this.prisma.user.create({ data });
  }
  async findAll(params: Prisma.UserFindManyArgs = {}) {
    return await this.prisma.user.findMany(params);
  }
  // async findFirst(params: Prisma.UserFindFirstArgs) {
  //   return await this.prisma.user.findMany({
  //     where: params.where,
  //     orderBy: params.orderBy,
  //     skip: params.skip,
  //     take: params.take,
  //   });
  // }
  async count(where: Prisma.UserWhereInput) {
    return await this.prisma.user.count({ where });
  }

  async findOne(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
  }
  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }
  async updateUser(id: number, data: UpdateUserRepositoryInput) {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }
  async deleteUser(id: number) {
    return await this.prisma.user.delete({ where: { id } });
  }
}
