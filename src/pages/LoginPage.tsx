import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import type { Role } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { createPreviewAuth } from '@/auth/previewSession';
import { homePathForRole, ROLE_LABELS } from '@/auth/roles';
import { AppShell } from '@/layout/AppShell';

const PREVIEW_ROLES: readonly Role[] = ['Waiter', 'Kitchen', 'Cashier', 'Manager'];

export function LoginPage() {
  const { isAuthenticated, role, login, setAuth } = useAuth();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={homePathForRole(role)} replace />;
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

        {import.meta.env.DEV ? (
          <div className="preview-entry">
            <p className="muted">API kapalıyken arayüzü aç</p>
            <div className="actions">
              {PREVIEW_ROLES.map((previewRole) => (
                <button
                  key={previewRole}
                  className="btn"
                  type="button"
                  onClick={() => setAuth(createPreviewAuth(previewRole))}
                >
                  {ROLE_LABELS[previewRole]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
