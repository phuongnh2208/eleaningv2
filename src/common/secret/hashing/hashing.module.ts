import { Module } from '@nestjs/common';
import { PasswordHasherStrategy } from './password-hasher.strategy';
import { BcyptPasswordHasherStrategy } from './bcrypt-password-hasher.strategy';

@Module({
  providers: [
    {
      provide: PasswordHasherStrategy,
      useClass: BcyptPasswordHasherStrategy,
    },
  ],
  exports: [PasswordHasherStrategy],
})
export class HashingModule {}
