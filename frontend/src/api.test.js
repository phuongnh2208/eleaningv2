import { describe, it, expect } from 'vitest';
import { getApiErrorMessage, getApiErrorStatus } from './api.js';

describe('getApiErrorMessage', () => {
  it('extracts message from NestJS error response', () => {
    const err = { response: { data: { message: 'Sai email hoặc mật khẩu' } } };
    expect(getApiErrorMessage(err)).toBe('Sai email hoặc mật khẩu');
  });

  it('extracts error field when message is absent', () => {
    const err = { response: { data: { error: 'Something broke' } } };
    expect(getApiErrorMessage(err)).toBe('Something broke');
  });

  it('joins class-validator array messages', () => {
    const err = { response: { data: { message: ['email invalid', 'password too short'] } } };
    expect(getApiErrorMessage(err)).toBe('email invalid, password too short');
  });

  it('falls back to default message when nothing usable is present', () => {
    const err = {};
    expect(getApiErrorMessage(err, 'fallback text')).toBe('fallback text');
  });
});

describe('getApiErrorStatus', () => {
  it('reads the HTTP status from the response', () => {
    const err = { response: { status: 403 } };
    expect(getApiErrorStatus(err)).toBe(403);
  });

  it('returns undefined when there is no response', () => {
    expect(getApiErrorStatus({})).toBeUndefined();
  });
});
