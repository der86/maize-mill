import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { tokenStorage } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch {
      await tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, accessToken, refreshToken } = data.data;
    await tokenStorage.setTokens(accessToken, refreshToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors on logout, clear local state regardless
    }
    await tokenStorage.clearTokens();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: loadUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
