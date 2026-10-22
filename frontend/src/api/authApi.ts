import { apiClient } from './apiClient';
import { AuthResponse, LoginRequest, RegisterClientRequest, RegisterEmployeeRequest, normalizeRole } from '../types/auth';
import { MOCK_USERS } from './mockData';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post<any>('/auth/login', {
        username: credentials.username,
        password: credentials.password,
      }, { timeout: 2000 });

      const data = res.data;

      // Handle both nested and flat responses from .NET
      const accessToken = data.accessToken || data.tokens?.accessToken || data.token;
      const refreshToken = data.refreshToken || data.tokens?.refreshToken || '';
      const rawUser = data.user || data;

      const user = {
        id: rawUser.id || rawUser.userId || `usr-${Date.now()}`,
        username: rawUser.username || credentials.username,
        role: normalizeRole(rawUser.role),
        fullName: rawUser.fullName || `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim() || credentials.username,
        inn: rawUser.inn || (credentials.username.startsWith('client') ? '500100000011' : undefined),
      };

      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: data.expiresIn || 3600,
        },
      };
    } catch {
      // Mock fallback for offline backend
      const lower = credentials.username.toLowerCase();
      const found = MOCK_USERS.find((u) => u.username.toLowerCase() === lower);

      const isAnalyst = lower.includes('analyst') || lower.includes('admin') || lower === 'analyst';

      const user = found || {
        id: isAnalyst ? 'usr-analyst-01' : 'usr-client-01',
        username: credentials.username,
        role: isAnalyst ? ('BankEmployee' as const) : ('Client' as const),
        fullName: isAnalyst ? 'Сергей Андеррайтер' : 'Иван Иванов',
        inn: isAnalyst ? undefined : '500100000011',
      };

      const tokens = {
        accessToken: `mock-jwt-${user.role}-${Date.now()}`,
        refreshToken: `mock-refresh-${Date.now()}`,
        expiresIn: 3600,
      };

      return { user, tokens };
    }
  },

  registerClient: async (data: RegisterClientRequest): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post<any>('/auth/register', {
        username: data.username,
        password: data.password,
        inn: data.inn,
        fullName: data.fullName,
      }, { timeout: 2000 });

      const resData = res.data;
      const accessToken = resData.accessToken || resData.tokens?.accessToken || `jwt-${Date.now()}`;
      const refreshToken = resData.refreshToken || resData.tokens?.refreshToken || '';

      const user = {
        id: resData.user?.id || resData.userId || `usr-${Date.now()}`,
        username: data.username,
        role: 'Client' as const,
        fullName: data.fullName,
        inn: data.inn,
        companyName: `ИП ${data.fullName}`,
      };

      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      };
    } catch {
      const user = {
        id: `usr-${Date.now()}`,
        username: data.username,
        role: 'Client' as const,
        fullName: data.fullName,
        inn: data.inn,
        companyName: `ИП ${data.fullName}`,
      };
      const tokens = {
        accessToken: `mock-jwt-Client-${Date.now()}`,
        refreshToken: `mock-refresh-${Date.now()}`,
        expiresIn: 3600,
      };
      return { user, tokens };
    }
  },

  registerEmployee: async (data: RegisterEmployeeRequest): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post<any>('/auth/employee/register', {
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        department: data.department || 'Андеррайтинг',
      }, { timeout: 2000 });

      const resData = res.data;
      const accessToken = resData.accessToken || resData.tokens?.accessToken || `jwt-${Date.now()}`;
      const refreshToken = resData.refreshToken || resData.tokens?.refreshToken || '';

      const user = {
        id: resData.user?.id || resData.userId || `usr-${Date.now()}`,
        username: data.username,
        role: 'BankEmployee' as const,
        fullName: data.fullName,
        department: data.department || 'Андеррайтинг',
      };

      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      };
    } catch {
      const user = {
        id: `usr-${Date.now()}`,
        username: data.username,
        role: 'BankEmployee' as const,
        fullName: data.fullName,
        department: data.department || 'Андеррайтинг',
      };
      const tokens = {
        accessToken: `mock-jwt-BankEmployee-${Date.now()}`,
        refreshToken: `mock-refresh-${Date.now()}`,
        expiresIn: 3600,
      };
      return { user, tokens };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {}, { timeout: 1000 });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('smart_kabinet_access_token');
      localStorage.removeItem('smart_kabinet_refresh_token');
      localStorage.removeItem('smart_kabinet_user');
    }
  },
};
