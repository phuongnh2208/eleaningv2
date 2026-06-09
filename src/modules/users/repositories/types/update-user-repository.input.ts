import { Role, Status } from 'src/generated/prisma/client';

export type UpdateRepositoryInput = {
  email?: string;
  passwordHash?: string;
  role?: Role;
  status?: Status;
};
