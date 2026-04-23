import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserMapper } from './mappers/user.mapper';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async createUser(data: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.password,
      },
    });
    return UserMapper.toResponse(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map((user) => UserMapper.toResponse(user));
  }
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return UserMapper.toResponse(user);
  }
  async updateUser(id: number, data: UpdateUserDto) {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }
  async deleteUser(id: number) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
