import { useCallback, useEffect, useState } from 'react';
import * as api from './api.js';
import GoogleLoginButton from './components/GoogleLoginButton.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import MyEnrollmentsPage from './pages/MyEnrollmentsPage.jsx';
import PublicEnrollPage from './pages/PublicEnrollPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState(readStoredUser);
  const [message, setMessage] = useState(null);
  const [tab, setTab] = useState('courses');
  const [enrollTarget, setEnrollTarget] = useState(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');

  const saveSession = useCallback((data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken || '');
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  // Bootstrap session on reload: if a token is present, ask the backend
  // who we are via GET /users/me. An expired/invalid token clears the
  // session and falls back to logged-out state.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .getCurrentUser()
      .then((data) => {
        if (cancelled) return;
        setUser(data);
        localStorage.setItem('currentUser', JSON.stringify(data));
      })
      .catch(() => {
        if (cancelled) return;
        api.logout();
        setToken(null);
        setUser(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleCredential(idToken) {
    try {
      const data = await api.googleLogin(idToken);
      saveSession(data);
      setMessage({ type: 'success', text: `Đăng nhập thành công: ${data.user.email}` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: api.getApiErrorMessage(err, 'Đăng nhập Google thất bại.'),
      });
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const data = await api.loginWithEmailPassword(loginEmail, loginPassword);
      saveSession(data);
      setMessage({ type: 'success', text: `Đăng nhập thành công: ${data.user.email}` });
    } catch (err) {
      setMessage({ type: 'error', text: api.getApiErrorMessage(err, 'Đăng nhập thất bại.') });
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      await api.registerWithEmailPassword(regEmail, regPassword);
      setMessage({ type: 'success', text: 'Đăng ký thành công — hãy đăng nhập.' });
    } catch (err) {
      setMessage({ type: 'error', text: api.getApiErrorMessage(err, 'Đăng ký thất bại.') });
    }
  }

  // Attaches a verified Google identity to the current (email/password)
  // account. Does not change the session/token — only unlocks the "correct
  // Google account" requirement for paid-video access.
  async function handleLinkGoogle(idToken) {
    try {
      const data = await api.linkGoogleAccount(idToken);
      setUser(data);
      localStorage.setItem('currentUser', JSON.stringify(data));
      setMessage({ type: 'success', text: 'Đã liên kết tài khoản Google thành công.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: api.getApiErrorMessage(err, 'Liên kết Google thất bại.'),
      });
    }
  }

  function logout() {
    api.logout();
    setToken(null);
    setUser(null);
    setMessage(null);
    window.google?.accounts?.id?.disableAutoSelect?.();
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="app">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <header className="header">
        <div className="brand-block">
          <span className="eyebrow">E-Learning</span>
          <h1>Học trực tuyến qua video Google Drive</h1>
          <p>Xem khóa học, đăng ký, và học qua video Google Drive theo đúng quyền của bạn.</p>
        </div>

        <div className="header-actions">
          {token ? (
            <div className="user-info">
              {user?.picture ? (
                <img src={user.picture} alt="avatar" className="avatar" />
              ) : (
                <div className="avatar avatar-placeholder">
                  {(user?.name || user?.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="user-copy">
                <span className="user-name">{user?.name || user?.email || 'Đang xác thực...'}</span>
                <span className="user-email">{user?.email}</span>
                <span className="user-class">{user?.role}</span>
                {!user?.hasGoogleAccount && (
                  <div className="link-google-row">
                    <span className="hint" style={{ margin: 0 }}>
                      Liên kết Google để tham gia khóa học:
                    </span>
                    <GoogleLoginButton onCredential={handleLinkGoogle} />
                  </div>
                )}
              </div>
              <button className="btn-logout" onClick={logout} type="button">
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="auth-card">
              <span className="auth-title">
                {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </span>
              <span className="auth-label">
                Đăng nhập để xem video và đăng ký khóa học
              </span>
              <GoogleLoginButton onCredential={handleGoogleCredential} />
              <div className="auth-divider">hoặc dùng email</div>
              <div className="email-auth">
                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="mini-form">
                    <input
                      placeholder="Email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                    <input
                      placeholder="Mật khẩu"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button className="btn-secondary" type="submit">
                      Đăng nhập
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="mini-form">
                    <input
                      placeholder="Email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                    <input
                      placeholder="Mật khẩu"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                    <button className="btn-secondary" type="submit">
                      Đăng ký
                    </button>
                  </form>
                )}
                <button
                  className="link-button auth-switch"
                  type="button"
                  onClick={() => setAuthMode((m) => (m === 'login' ? 'register' : 'login'))}
                >
                  {authMode === 'login'
                    ? 'Chưa có tài khoản? Đăng ký'
                    : 'Đã có tài khoản? Đăng nhập'}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {message && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}

      <nav className="tabs">
        <button
          className={tab === 'courses' ? 'active' : ''}
          onClick={() => setTab('courses')}
          type="button"
        >
          Khóa học
        </button>
        {token && (
          <button
            className={tab === 'me' ? 'active' : ''}
            onClick={() => setTab('me')}
            type="button"
          >
            Khóa học của tôi
          </button>
        )}
        {isAdmin && (
          <button
            className={tab === 'admin' ? 'active' : ''}
            onClick={() => setTab('admin')}
            type="button"
          >
            Quản trị
          </button>
        )}
      </nav>

      {tab === 'courses' &&
        (enrollTarget ? (
          <PublicEnrollPage
            presetCourse={enrollTarget}
            onDone={() => setEnrollTarget(null)}
          />
        ) : (
          <CoursesPage
            isLoggedIn={Boolean(token)}
            onRequestEnroll={setEnrollTarget}
            admin={isAdmin}
          />
        ))}

      {tab === 'me' && token && <MyEnrollmentsPage currentUser={user} />}
      {tab === 'admin' && isAdmin && <AdminPage />}
    </div>
  );
}

export default App;
