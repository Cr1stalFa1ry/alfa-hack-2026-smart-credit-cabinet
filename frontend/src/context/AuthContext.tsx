import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, LoginRequest, normalizeRole } from '../types/auth';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Восстановление сессии из localStorage при наличии валидного токена
    const savedUser = localStorage.getItem('smart_kabinet_user');
    const token = localStorage.getItem('smart_kabinet_access_token');

    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        const normalized: AuthUser = {
          ...parsed,
          role: normalizeRole(parsed.role),
        };
        setUser(normalized);
      } catch {
        setUser(null);
        localStorage.removeItem('smart_kabinet_user');
      }
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      const normalizedUser: AuthUser = {
        ...response.user,
        role: normalizeRole(response.user.role),
      };

      setUser(normalizedUser);
      localStorage.setItem('smart_kabinet_user', JSON.stringify(normalizedUser));
      if (response.tokens?.accessToken) {
        localStorage.setItem('smart_kabinet_access_token', response.tokens.accessToken);
      }
      if (response.tokens?.refreshToken) {
        localStorage.setItem('smart_kabinet_refresh_token', response.tokens.refreshToken);
      }
      return normalizedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem('smart_kabinet_user');
    localStorage.removeItem('smart_kabinet_access_token');
    localStorage.removeItem('smart_kabinet_refresh_token');
    localStorage.removeItem('smart_kabinet_demo_mode');
  };

  const handleSetUser = (u: AuthUser | null) => {
    if (u) {
      const normalized = { ...u, role: normalizeRole(u.role) };
      setUser(normalized);
      localStorage.setItem('smart_kabinet_user', JSON.stringify(normalized));
    } else {
      setUser(null);
      localStorage.removeItem('smart_kabinet_user');
      localStorage.removeItem('smart_kabinet_access_token');
      localStorage.removeItem('smart_kabinet_refresh_token');
    }
  };

  const role: UserRole = normalizeRole(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUser: handleSetUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
