import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserRepositoryInput } from './types/create-user-repository.input';
import { UpdateRepositoryInput } from './types/update-user-repository.input';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  async createUser(data: CreateUserRepositoryInput) {
    return await this.prisma.user.create({ data });
  }
  async findAll(params: Prisma.UserFindFirstArgs) {
    return await this.prisma.user.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }
  async count(where: any) {
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
  async updateUser(id: number, data: UpdateRepositoryInput) {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }
  async deleteUser(id: number) {
    return await this.prisma.user.delete({ where: { id } });
  }
}
