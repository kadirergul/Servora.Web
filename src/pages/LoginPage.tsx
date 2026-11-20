import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { pathAfterLogin } from '@/auth/roles';
import { AppShell } from '@/layout/AppShell';

function requestedPath(state: unknown): string | null {
  if (!state || typeof state !== 'object' || !('from' in state)) {
    return null;
  }

  const from = state.from;
  return typeof from === 'string' ? from : null;
}

export function LoginPage() {
  const location = useLocation();
  const { isAuthenticated, role, login } = useAuth();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const destination = pathAfterLogin(role, requestedPath(location.state));

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ userName: userName.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell contentClassName="content content-centered">
      <div className="card card-login">
        <h1 className="brand">Servora</h1>
        <p className="subtitle">Hesabına giriş yap</p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="userName">Kullanıcı adı</label>
            <input
              id="userName"
              type="text"
              autoComplete="username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
