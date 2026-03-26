import React from 'react';

export interface AccessTokenPayload {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

export interface User {
  userId: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}
