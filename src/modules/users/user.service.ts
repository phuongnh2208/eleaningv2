import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async createUser(data: { email: string; password: string }) {
    return await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.password,
      },
    });
  }
  async findAll() {
    return await this.prisma.user.findMany();
  }
  async findOne(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }
  async updateUser(id: number, data: any) {
    return await this.prisma.user.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
    });
  }
  async deleteUser(id: number) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
