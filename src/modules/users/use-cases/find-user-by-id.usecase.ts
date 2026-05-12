import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/modules/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly useRepository: UserRepository) {}
  async excutive(id: number) {
    const user = await this.useRepository.findOne(id);
    return UserMapper.toResponse(user);
  }
}
