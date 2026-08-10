import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { formatApiError } from '../data/fleet';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // ignore
    }
    localStorage.removeItem('admin_token');
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.user?.role !== 'admin') {
        localStorage.removeItem('admin_token');
        throw new Error('Admin access required');
      }
      localStorage.setItem('admin_token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      throw new Error(formatApiError(err));
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/users/me')
      .then((data) => {
        if (data.user?.role !== 'admin') {
          localStorage.removeItem('admin_token');
          setUser(null);
        } else {
          setUser(data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: !!user }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
