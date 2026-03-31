import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api, setAccessToken, refreshSession } from '../services/commonAPI';
import { User, AccessTokenPayload } from '../types/auth';
import { AuthContext } from './AuthContext';
import Loader from '../pages/Loader';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- SET SESSION ---------- */
  const setSession = (accessToken: string | null): User | null => {
    if (!accessToken) {
      setUser(null);
      setAccessToken(null);
      return null;
    }

    const decoded = jwtDecode<AccessTokenPayload>(accessToken);

    const userData: User = {
      userId: decoded.userId,
      role: decoded.role,
    };

    setUser(userData);
    setAccessToken(accessToken);

    return userData;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (localStorage.getItem('hasSession')) {
          const accessToken = await refreshSession();
          if (accessToken) {
            setSession(accessToken);
          }
        }
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/api/auth/login', {
      email,
      password,
      client_type: 'web',
    });

    localStorage.setItem('hasSession', 'true');

    const userData = setSession(res.data.accessToken);

    if (!userData) {
      throw new Error('Login failed: No access token received');
    }

    return userData;
  };

  const logout = async (): Promise<void> => {
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
      {loading ? <Loader /> : children}
    </AuthContext.Provider>
  );
};
