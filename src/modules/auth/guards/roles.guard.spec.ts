import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: { getAllAndOverride: jest.Mock };
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockRequest: { user: { role: Role } };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    mockRequest = {
      user: { role: Role.USER },
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };

    guard = new RolesGuard(mockReflector as any);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);

    expect(result).toBe(true);
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });

  it('should allow access when user has required role (ADMIN)', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    mockRequest.user.role = Role.ADMIN;

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);

    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role (USER vs ADMIN)', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    mockRequest.user.role = Role.USER;

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);

    expect(result).toBe(false);
  });

  it('should allow access when user has one of multiple required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.USER]);
    mockRequest.user.role = Role.USER;

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);

    expect(result).toBe(true);
  });

  it('should deny access when user has none of the required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    mockRequest.user.role = Role.USER;

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);

    expect(result).toBe(false);
  });
});
