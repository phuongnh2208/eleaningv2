import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App.jsx';
import * as api from './api.js';

vi.mock('./api.js', async () => {
  const actual = await vi.importActual('./api.js');
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    getCourses: vi.fn().mockResolvedValue([]),
    logout: vi.fn(),
  };
});

describe('App session bootstrap', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('restores the session on reload when the stored token is still valid', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ id: 1, email: 'a@b.com', role: 'USER' }),
    );
    api.getCurrentUser.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      role: 'USER',
    });

    render(<App />);

    await waitFor(() => expect(api.getCurrentUser).toHaveBeenCalled());
    expect((await screen.findAllByText('a@b.com')).length).toBeGreaterThan(0);
  });

  it('clears the session when the stored token is rejected by the backend', async () => {
    localStorage.setItem('accessToken', 'expired-token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ id: 1, email: 'a@b.com', role: 'USER' }),
    );
    api.getCurrentUser.mockRejectedValue({ response: { status: 401 } });

    render(<App />);

    await waitFor(() => expect(api.logout).toHaveBeenCalled());
    expect(await screen.findByText(/Đăng nhập để xem video/i)).toBeInTheDocument();
  });

  it('shows the logged-out auth card when there is no stored token', async () => {
    render(<App />);
    expect(
      await screen.findByText(/Đăng nhập để xem video/i),
    ).toBeInTheDocument();
    expect(api.getCurrentUser).not.toHaveBeenCalled();
  });

  it('shows only one form at a time and toggles between login and register', async () => {
    render(<App />);
    await screen.findByText(/Đăng nhập để xem video/i);

    // Login form is shown by default.
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Đăng nhập' }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mật khẩu/i)).toBeInTheDocument();

    // Register form is hidden initially.
    expect(
      screen.queryByPlaceholderText(/email mới/i),
    ).not.toBeInTheDocument();

    // Toggle to register.
    fireEvent.click(screen.getByText(/Chưa có tài khoản\? Đăng ký/i));
    expect(screen.queryByRole('button', { name: 'Đăng nhập' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Đăng ký' }),
    ).toBeInTheDocument();

    // Toggle back to login.
    fireEvent.click(screen.getByText(/Đã có tài khoản\? Đăng nhập/i));
    expect(
      screen.getByRole('button', { name: 'Đăng nhập' }),
    ).toBeInTheDocument();
  });

  it('offers to link a Google account for a logged-in user who has none yet', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 1,
        email: 'a@b.com',
        role: 'USER',
        hasGoogleAccount: false,
      }),
    );
    api.getCurrentUser.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      role: 'USER',
      hasGoogleAccount: false,
    });

    render(<App />);

    await waitFor(() => expect(api.getCurrentUser).toHaveBeenCalled());
    expect(
      await screen.findByText(/Liên kết Google để tham gia khóa học/i),
    ).toBeInTheDocument();
  });
});
