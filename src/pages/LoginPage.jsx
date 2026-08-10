import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <form onSubmit={onSubmit} className="login-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary-container text-sm font-bold text-primary">
            GR
          </div>
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-secondary">
              Dubai · UAE
            </p>
            <h1 className="text-xl font-bold text-primary">Admin sign in</h1>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant">
          Manage fleet inventory, photos, and client bookings.
        </p>

        <label className="mt-6 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Email
          <input
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-surface px-3 py-3 outline-none focus:border-secondary"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="mt-4 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Password
          <input
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-surface px-3 py-3 outline-none focus:border-secondary"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="admin-btn admin-btn--primary mt-6 w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
