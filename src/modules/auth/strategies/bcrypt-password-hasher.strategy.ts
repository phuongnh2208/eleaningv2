// Mã hóa bcypt tuân theo luật strategy
import { Injectable } from '@nestjs/common';
import { PasswordHasherStrategy } from './password-hasher.strategy';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcyptPasswordHasherStrategy extends PasswordHasherStrategy {
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
  async compare(password: string, passwordHash: string): Promise<boolean> {
    return await bcrypt.compare(password, passwordHash);
  }
}
