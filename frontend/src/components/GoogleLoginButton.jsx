import { useEffect, useRef } from 'react';
import { useGoogleScript } from '../auth/googleAuth.js';

const GOOGLE_CLIENT_ID = import.meta.env.REACT_APP_GOOGLE_CLIENT_ID;

// onCredential receives the raw Google credential string (response.credential).
// It must NOT be treated as an app access token — the caller is responsible
// for exchanging it via POST /auth/google-login.
export default function GoogleLoginButton({ onCredential }) {
  const buttonRef = useRef(null);
  const { ready, error } = useGoogleScript();

  useEffect(() => {
    if (!ready || !buttonRef.current || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => onCredential(response.credential),
    });

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
    });
  }, [ready, onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="auth-note">
        Thiếu cấu hình REACT_APP_GOOGLE_CLIENT_ID — không thể đăng nhập bằng
        Google.
      </p>
    );
  }

  if (error) {
    return <p className="auth-note auth-note-error">{error}</p>;
  }

  return <div ref={buttonRef} data-testid="google-button-holder" />;
}
