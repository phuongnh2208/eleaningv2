import { Role } from 'src/generated/prisma/client';

export type CreateUserRepositoryInput = {
  email: string;
  passwordHash?: string | null;
  googleId?: string;
  name?: string | null;
  picture?: string | null;
  role?: Role;
};
