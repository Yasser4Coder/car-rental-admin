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
    <div className="min-h-screen grid place-items-center px-4 bg-surface">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">Dubai · UAE</p>
        <h1 className="mt-1 text-2xl font-bold text-primary">Admin login</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Manage fleet inventory and bookings.</p>

        <label className="mt-6 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Email
          <input
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-surface px-3 py-3 outline-none focus:border-secondary"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            required
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-[#08331c] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
