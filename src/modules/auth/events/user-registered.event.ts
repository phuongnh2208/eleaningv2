import { Role, Status } from 'src/generated/prisma/client';

export class UserRegisteredEvent {
  static eventName = 'USER_REGISTERED';
  readonly eventName = UserRegisteredEvent.eventName;
  constructor(
    public user: {
      id: number;
      email: string;
      role: Role;
      status: Status;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {}
}
