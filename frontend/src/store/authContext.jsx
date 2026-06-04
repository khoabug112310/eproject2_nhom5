// State Management - Auth Context
// TODO: Có thể dùng Redux, Zustand, hoặc Context API

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedDisplayName = localStorage.getItem('userDisplayName');
    const storedUsername = localStorage.getItem('userName');
    return storedRole ? { role: storedRole, displayName: storedDisplayName || storedUsername || '', username: storedUsername || '' } : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = useCallback(async (username, password) => {
    try {
      const res = await authAPI.login(username, password);
      const { token, role, username, displayName } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role || '');
      localStorage.setItem('userName', username || '');
      localStorage.setItem('userDisplayName', displayName || username || '');
      setToken(token);
      let userObj = { role, username: username || '', displayName: displayName || username || '' };
      setUser(userObj);
      return { success: true, role };
    } catch (err) {
      console.error('login error', err?.response?.data || err.message);
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userDisplayName');
  }, []);

  const impersonate = useCallback((data) => {
    const { token, role, username, displayName } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role || '');
    localStorage.setItem('userName', username || '');
    localStorage.setItem('userDisplayName', displayName || username || '');
    setToken(token);
    setUser({ role, username: username || '', displayName: displayName || username || '' });
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrateCurrentUser = async () => {
      if (!token) return;
      if (user && user.displayName) return;

      try {
        const res = await authAPI.me();
        const { username, role, displayName } = res.data.data;
        if (!mounted) return;
        const nextUser = { username: username || '', role, displayName: displayName || username || '' };
        setUser(nextUser);
        localStorage.setItem('userRole', role || '');
        localStorage.setItem('userName', username || '');
        localStorage.setItem('userDisplayName', displayName || username || '');
      } catch (err) {
        // Ignore hydration failures; the token may be invalid and the UI will fall back to generic text.
      }
    };

    hydrateCurrentUser();

    return () => {
      mounted = false;
    };
  }, [token, user]);

  const value = {
    user,
    token,
    login,
    logout,
    impersonate,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
