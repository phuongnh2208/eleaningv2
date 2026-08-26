import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  LogOut,
  User,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Link,
  LogIn,
  UserPlus,
} from 'lucide-react';
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
  const [selectedCourseId, setSelectedCourseId] = useState(null);

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
  }, [token]);

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
    setTab('courses');
    setSelectedCourseId(null);
    window.google?.accounts?.id?.disableAutoSelect?.();
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="app">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <header className="header">
        <div className="brand-block">
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <GraduationCap size={15} /> E-Learning
          </span>
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
                <span className="user-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <User size={13} /> {user?.name || user?.email || 'Đang xác thực...'}
                </span>
                <span className="user-email" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={13} /> {user?.email}
                </span>
                <span className="user-class" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={12} /> {user?.role}
                </span>
                {!user?.hasGoogleAccount && (
                  <div className="link-google-row">
                    <span className="hint" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Link size={12} /> Liên kết Google để tham gia khóa học:
                    </span>
                    <GoogleLoginButton onCredential={handleLinkGoogle} />
                  </div>
                )}
              </div>
              <button
                className="btn-logout"
                onClick={logout}
                type="button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <LogOut size={14} /> Đăng xuất
              </button>
            </div>
          ) : (
            <div className="auth-card">
              <span className="auth-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {authMode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
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
                    <button className="btn-secondary" type="submit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <LogIn size={14} /> Đăng nhập
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
                    <button className="btn-secondary" type="submit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <UserPlus size={14} /> Đăng ký
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
        <div className={`message message-${message.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <nav className="tabs">
        <button
          className={tab === 'courses' ? 'active' : ''}
          onClick={() => setTab('courses')}
          type="button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <BookOpen size={16} />
          Khóa học
        </button>
        {token && !isAdmin && (
          <button
            className={tab === 'me' ? 'active' : ''}
            onClick={() => setTab('me')}
            type="button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <GraduationCap size={16} />
            Khóa học của tôi
          </button>
        )}
        {isAdmin && (
          <button
            className={tab === 'admin' ? 'active' : ''}
            onClick={() => setTab('admin')}
            type="button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ShieldCheck size={16} />
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
            selectedCourseId={selectedCourseId}
            onCourseSelected={setSelectedCourseId}
          />
        ))}

      {tab === 'me' && token && !isAdmin && (
        <MyEnrollmentsPage
          currentUser={user}
          onGoToCourse={(courseId) => {
            setSelectedCourseId(courseId);
            setTab('courses');
          }}
        />
      )}
      {tab === 'admin' && isAdmin && <AdminPage />}
    </div>
  );
}

export default App;
