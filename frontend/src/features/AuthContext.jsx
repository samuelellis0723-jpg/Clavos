import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { setOnUnauthorized } from '../services/apiClient.js';
import { loginWithCredentials, fetchCurrentActor, logoutSession } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Opaque Bearer token stored strictly in React memory (not localStorage/sessionStorage)
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  const clearSession = useCallback((reasonMessage = null) => {
    setToken(null);
    setUser(null);
    setExpiresAt(null);
    if (reasonMessage) {
      setAuthNotice(reasonMessage);
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(({ message }) => {
      clearSession(
        message || 'La sesión ha expirado o fue revocada. Inicia sesión nuevamente.'
      );
    });
    return () => setOnUnauthorized(null);
  }, [clearSession]);

  const handleLogin = useCallback(async ({ email, password }) => {
    setAuthNotice(null);
    const response = await loginWithCredentials({ email, password });
    const data = response?.data;
    if (!data?.access_token) {
      throw new Error('Respuesta de inicio de sesión incompleta.');
    }
    setToken(data.access_token);
    setUser(data.user || null);
    setExpiresAt(data.expires_at || null);
    return data;
  }, []);

  const handleRefreshMe = useCallback(async () => {
    if (!token) return null;
    setIsCheckingSession(true);
    try {
      const response = await fetchCurrentActor(token);
      if (response?.data) {
        setUser(response.data);
      }
      return response?.data || null;
    } finally {
      setIsCheckingSession(false);
    }
  }, [token]);

  const handleLogout = useCallback(async () => {
    const activeToken = token;
    clearSession('Sesión cerrada correctamente.');
    if (activeToken) {
      try {
        await logoutSession(activeToken);
      } catch {
        // Session already cleared locally
      }
    }
  }, [token, clearSession]);

  const hasRole = useCallback(
    (...allowedRoles) => {
      if (!user || !Array.isArray(user.roles)) return false;
      if (user.roles.includes('admin')) return true;
      return allowedRoles.some((r) => user.roles.includes(r));
    },
    [user]
  );

  const hasExactRole = useCallback(
    (roleName) => {
      if (!user || !Array.isArray(user.roles)) return false;
      return user.roles.includes(roleName);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      expiresAt,
      authNotice,
      isAuthenticated: Boolean(token && user),
      isCheckingSession,
      setAuthNotice,
      login: handleLogin,
      logout: handleLogout,
      refreshMe: handleRefreshMe,
      clearSession,
      hasRole,
      hasExactRole,
    }),
    [
      token,
      user,
      expiresAt,
      authNotice,
      isCheckingSession,
      handleLogin,
      handleLogout,
      handleRefreshMe,
      clearSession,
      hasRole,
      hasExactRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de <AuthProvider>.');
  }
  return ctx;
}
