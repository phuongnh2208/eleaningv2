import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserUseCase } from './use-cases/create-user.usecase';
import { FindAllUsersUseCase } from './use-cases/find-all-users.usecase';
import { FindUserByIdUseCase } from './use-cases/find-user-by-id.usecase';
import { UpdateUserUseCase } from './use-cases/update-user.usecase';
import { DeleteUserUseCase } from './use-cases/delete-user.usecase';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findAllUsersUsecase: FindAllUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  async createUser(@Body() body: CreateUserDto) {
    return await this.createUserUseCase.executive(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: any) {
    return await this.findAllUsersUsecase.executive(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return await this.findUserByIdUseCase.excutive(req.user, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateUser(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    return await this.updateUserUseCase.executive(req.user, Number(id), body);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return await this.deleteUserUseCase.executive(Number(id));
  }
}
