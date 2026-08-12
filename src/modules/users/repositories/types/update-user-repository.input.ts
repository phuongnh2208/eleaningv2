import { Role, Status } from 'src/generated/prisma/client';

export type UpdateUserRepositoryInput = {
  email?: string;
  passwordHash?: string;
  role?: Role;
  status?: Status;
};
