import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, LoginRequest, normalizeRole } from '../types/auth';
import { authApi } from '../api/authApi';
import { MOCK_USERS } from '../api/mockData';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  enableDemoMode: (initialRole?: UserRole) => void;
  disableDemoMode: () => void;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('smart_kabinet_demo_mode') === 'true';
  });

  useEffect(() => {
    // Restore session from localStorage or initialize
    const savedUser = localStorage.getItem('smart_kabinet_user');
    const savedDemo = localStorage.getItem('smart_kabinet_demo_mode') === 'true';

    setIsDemoMode(savedDemo);

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const normalized: AuthUser = {
          ...parsed,
          role: normalizeRole(parsed.role),
        };
        setUser(normalized);
      } catch {
        setUser(null);
      }
    } else if (savedDemo) {
      // Default to demo client if in demo mode
      setUser(MOCK_USERS[0]);
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
      // Normal login exits demo mode
      setIsDemoMode(false);
      localStorage.setItem('smart_kabinet_demo_mode', 'false');

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
    await authApi.logout();
    setUser(null);
    setIsDemoMode(false);
    localStorage.setItem('smart_kabinet_demo_mode', 'false');
    localStorage.removeItem('smart_kabinet_user');
    localStorage.removeItem('smart_kabinet_access_token');
    localStorage.removeItem('smart_kabinet_refresh_token');
  };

  const enableDemoMode = (initialRole: UserRole = 'Client') => {
    setIsDemoMode(true);
    localStorage.setItem('smart_kabinet_demo_mode', 'true');
    const demoUser = MOCK_USERS.find((u) => u.role === initialRole) || MOCK_USERS[0];
    setUser(demoUser);
    localStorage.setItem('smart_kabinet_user', JSON.stringify(demoUser));
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    localStorage.setItem('smart_kabinet_demo_mode', 'false');
    setUser(null);
    localStorage.removeItem('smart_kabinet_user');
    localStorage.removeItem('smart_kabinet_access_token');
    localStorage.removeItem('smart_kabinet_refresh_token');
  };

  // Switch role is ONLY available in demo mode
  const switchRole = (newRole: UserRole) => {
    if (!isDemoMode) return;
    const targetUser = MOCK_USERS.find((u) => u.role === newRole) || {
      id: `usr-${newRole.toLowerCase()}`,
      username: `${newRole.toLowerCase()}@alfa.ru`,
      role: newRole,
      fullName: newRole === 'Client' ? 'Иванов Иван Сергеевич' : 'Смирнова Анна Викторовна',
      inn: newRole === 'Client' ? '770123456789' : undefined,
    };
    setUser(targetUser);
    localStorage.setItem('smart_kabinet_user', JSON.stringify(targetUser));
  };

  const role: UserRole = normalizeRole(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        isDemoMode,
        enableDemoMode,
        disableDemoMode,
        login,
        logout,
        switchRole,
        setUser: (u) => {
          if (u) {
            const normalized = { ...u, role: normalizeRole(u.role) };
            setUser(normalized);
            localStorage.setItem('smart_kabinet_user', JSON.stringify(normalized));
            // When real user is set, ensure demo mode is turned off
            setIsDemoMode(false);
            localStorage.setItem('smart_kabinet_demo_mode', 'false');
          } else {
            setUser(null);
            localStorage.removeItem('smart_kabinet_user');
          }
        },
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
