import { useEffect, useState } from 'react';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

// Loads the Google Identity Services script once and reports readiness.
// Reused by GoogleLoginButton; kept separate so it's independently testable.
export function useGoogleScript() {
  const [ready, setReady] = useState(
    typeof window !== 'undefined' && !!window.google?.accounts?.id,
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ready) return undefined;

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => setReady(true));
      return undefined;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError('Không thể tải Google Identity Services.');
    document.body.appendChild(script);

    return () => {
      // Leave the script tag in place — Google's own script tracks a single
      // global init and removing/re-adding it repeatedly causes warnings.
    };
  }, [ready]);

  return { ready, error };
}
