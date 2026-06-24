// State Management - Auth Context
// TODO: Could use Redux, Zustand, or Context API

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

const getAuthStorageKey = (baseKey) => {
  const path = window.location.pathname;
  if (path.startsWith('/staff') || path.startsWith('/admin') || path.startsWith('/doctor') || path.startsWith('/accountant')) {
    return `portal_${baseKey}`;
  }
  return baseKey;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const key = (base) => getAuthStorageKey(base);
    const storedRole = localStorage.getItem(key('userRole'));
    const storedDisplayName = localStorage.getItem(key('userDisplayName'));
    const storedUsername = localStorage.getItem(key('userName'));
    const storedUserId = localStorage.getItem(key('userId'));
    return storedRole ? { role: storedRole, displayName: storedDisplayName || storedUsername || '', username: storedUsername || '', id: storedUserId } : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(getAuthStorageKey('token')));

  const login = useCallback(async (username, password) => {
    try {
      const res = await authAPI.login(username, password);
      const { token, role, username: uName, displayName, userId } = res.data.data;
      const prefix = (role === 'patient') ? '' : 'portal_';
      localStorage.setItem(`${prefix}token`, token);
      localStorage.setItem(`${prefix}userRole`, role || '');
      localStorage.setItem(`${prefix}userName`, uName || '');
      localStorage.setItem(`${prefix}userDisplayName`, displayName || uName || '');
      localStorage.setItem(`${prefix}userId`, userId || '');
      setToken(token);
      let userObj = { role, username: uName || '', displayName: displayName || uName || '', id: userId };
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
    const prefix = (window.location.pathname.startsWith('/staff') || window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/doctor') || window.location.pathname.startsWith('/accountant')) ? 'portal_' : '';
    localStorage.removeItem(`${prefix}token`);
    localStorage.removeItem(`${prefix}userRole`);
    localStorage.removeItem(`${prefix}userName`);
    localStorage.removeItem(`${prefix}userDisplayName`);
    localStorage.removeItem(`${prefix}userId`);
  }, []);

  const impersonate = useCallback((data) => {
    const { token, role, username: uName, displayName, userId } = data;
    const prefix = (role === 'patient') ? '' : 'portal_';
    localStorage.setItem(`${prefix}token`, token);
    localStorage.setItem(`${prefix}userRole`, role || '');
    localStorage.setItem(`${prefix}userName`, uName || '');
    localStorage.setItem(`${prefix}userDisplayName`, displayName || uName || '');
    localStorage.setItem(`${prefix}userId`, userId || '');
    setToken(token);
    setUser({ role, username: uName || '', displayName: displayName || uName || '', id: userId });
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrateCurrentUser = async () => {
      const currentToken = localStorage.getItem(getAuthStorageKey('token'));
      if (!currentToken) return;
      if (user && user.displayName && user.id) return;

      try {
        const res = await authAPI.me();
        const { username, role, displayName, userId } = res.data.data;
        if (!mounted) return;
        const nextUser = { username: username || '', role, displayName: displayName || username || '', id: userId };
        setUser(nextUser);
        const prefix = (role === 'patient') ? '' : 'portal_';
        localStorage.setItem(`${prefix}userRole`, role || '');
        localStorage.setItem(`${prefix}userName`, username || '');
        localStorage.setItem(`${prefix}userDisplayName`, displayName || username || '');
        localStorage.setItem(`${prefix}userId`, userId || '');
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
