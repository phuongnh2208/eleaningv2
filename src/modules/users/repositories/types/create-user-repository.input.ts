export type CreateUserRepositoryInput = {
  email: string;
  passwordHash?: string | null;
  googleId?: string;
};
