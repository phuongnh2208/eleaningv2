import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { AppException } from 'src/common/exceptions/app.exception';
import { AuthError } from '../constants/auth.errors';
import { Reflector } from '@nestjs/core';

type MockReflector = {
  getAllAndOverride: jest.Mock;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: MockReflector;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockRequest: { user: { role: Role } | undefined };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    mockRequest = {
      user: { role: Role.USER },
    };

    mockExecutionContext = {
      switchToHttp: () =>
        ({
          getRequest: () => mockRequest,
          getResponse: () => ({}),
          getNext: () => ({}),
        }) as never,
      getHandler: jest.fn(() => mockRequest),
      getClass: jest.fn(() => ({})),
    };

    guard = new RolesGuard(mockReflector as unknown as Reflector);
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
    mockRequest.user = { role: Role.ADMIN };

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);

    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role (USER vs ADMIN)', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    mockRequest.user = { role: Role.USER };

    expect(() =>
      guard.canActivate(mockExecutionContext as ExecutionContext),
    ).toThrow(AppException);
  });

  it('should allow access when user has one of multiple required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.USER]);
    mockRequest.user = { role: Role.USER };

    const result = guard.canActivate(mockExecutionContext as ExecutionContext);

    expect(result).toBe(true);
  });

  it('should deny access when user has none of the required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    mockRequest.user = { role: Role.USER };

    expect(() =>
      guard.canActivate(mockExecutionContext as ExecutionContext),
    ).toThrow(AppException);
    expect(() =>
      guard.canActivate(mockExecutionContext as ExecutionContext),
    ).toThrow(AuthError.FORBIDDEN.message);
  });

  it('should deny access when user is missing from request', () => {
    mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    mockRequest.user = undefined;

    expect(() =>
      guard.canActivate(mockExecutionContext as ExecutionContext),
    ).toThrow(AppException);
    expect(() =>
      guard.canActivate(mockExecutionContext as ExecutionContext),
    ).toThrow(AuthError.FORBIDDEN.message);
  });
});
