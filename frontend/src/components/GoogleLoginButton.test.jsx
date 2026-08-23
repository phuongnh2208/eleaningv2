import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GoogleLoginButton from './GoogleLoginButton.jsx';

describe('GoogleLoginButton', () => {
  const originalGoogle = window.google;

  beforeEach(() => {
    document.body.innerHTML = '';
    window.google = undefined;
  });

  afterEach(() => {
    window.google = originalGoogle;
    document
      .querySelectorAll('script[src="https://accounts.google.com/gsi/client"]')
      .forEach((el) => el.remove());
  });

  it('initializes and renders the Google button once the script loads', async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    const onCredential = vi.fn();

    render(<GoogleLoginButton onCredential={onCredential} />);

    const script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    expect(script).toBeTruthy();

    window.google = { accounts: { id: { initialize, renderButton } } };
    script.onload();

    await waitFor(() => expect(initialize).toHaveBeenCalled());
    expect(renderButton).toHaveBeenCalled();
    expect(initialize.mock.calls[0][0]).toMatchObject({
      client_id: expect.any(String),
    });
  });

  it('forwards response.credential to onCredential, not treating it as an app token', async () => {
    let capturedCallback;
    window.google = {
      accounts: {
        id: {
          initialize: ({ callback }) => {
            capturedCallback = callback;
          },
          renderButton: vi.fn(),
        },
      },
    };

    const onCredential = vi.fn();
    render(<GoogleLoginButton onCredential={onCredential} />);

    await waitFor(() => expect(capturedCallback).toBeDefined());
    capturedCallback({ credential: 'raw-google-id-token' });

    expect(onCredential).toHaveBeenCalledWith('raw-google-id-token');
  });

  it('shows a friendly holder even before the script is ready', () => {
    render(<GoogleLoginButton onCredential={vi.fn()} />);
    expect(screen.getByTestId('google-button-holder')).toBeInTheDocument();
  });
});
