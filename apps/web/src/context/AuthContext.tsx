import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api, setAccessToken } from '../services/commonAPI';

/* ================= TYPES ================= */

interface AccessTokenPayload {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

export interface User {
  userId: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | null>(null);

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- SET SESSION ---------- */
  const setSession = (accessToken: string | null) => {
    if (!accessToken) {
      setUser(null);
      setAccessToken(null);
      return;
    }

    const decoded = jwtDecode<AccessTokenPayload>(accessToken);

    setUser({
      userId: decoded.userId,
      role: decoded.role,
    });

    setAccessToken(accessToken);
  };

  /* ---------- APP INIT (SILENT REFRESH) ---------- */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Attempt to refresh token if user had a session
        if (localStorage.getItem('hasSession')) {
          const res = await api.post('/api/auth/refresh');
          setSession(res.data.accessToken);
        }
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /* ---------- LOGIN ---------- */
  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', {
      email,
      password,
      client_type: 'web',
    });

    localStorage.setItem('hasSession', 'true');
    setSession(res.data.accessToken);
  };

  /* ---------- LOGOUT ---------- */
  const logout = async () => {
    await api.post('/api/auth/logout');
    localStorage.removeItem('hasSession');
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};