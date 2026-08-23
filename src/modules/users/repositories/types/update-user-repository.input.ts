import { Role, Status } from 'src/generated/prisma/client';

export type UpdateUserRepositoryInput = {
  email?: string;
  passwordHash?: string | null;
  googleId?: string;
  role?: Role;
  status?: Status;
  name?: string | null;
  picture?: string | null;
};
