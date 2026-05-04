// === FILE: client/src/context/AuthContext.jsx ===
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AuthAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('pollcast_token');
      const stored = JSON.parse(localStorage.getItem('pollcast_user'));
      // Both token AND user must exist — otherwise clear stale data
      if (stored && token) return stored;
      if (stored && !token) {
        localStorage.removeItem('pollcast_user');
      }
      return null;
    } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const d = await AuthAPI.login(email, password);
    localStorage.setItem('pollcast_token', d.token);
    localStorage.setItem('pollcast_user', JSON.stringify(d.user));
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (payload) => {
    const d = await AuthAPI.register(payload);
    localStorage.setItem('pollcast_token', d.token);
    localStorage.setItem('pollcast_user', JSON.stringify(d.user));
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pollcast_token');
    localStorage.removeItem('pollcast_user');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, isAuthed: !!user }), [user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
