import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserReposotoryInput } from './types/create-user-repository.input';
import { UpdateRepositoryInput } from './types/update-user-repository.input';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  async createUser(data: CreateUserReposotoryInput) {
    return await this.prisma.user.create({ data });
  }
  async findAll() {
    return await this.prisma.user.findMany();
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
