import { apiClient } from './apiClient';
import { AuthResponse, LoginRequest, RegisterClientRequest, RegisterEmployeeRequest, normalizeRole } from '../types/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<any>('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });

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
      inn: rawUser.inn || undefined,
    };

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: data.expiresIn || 3600,
      },
    };
  },

  registerClient: async (data: RegisterClientRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<any>('/auth/register', {
      username: data.username,
      password: data.password,
      inn: data.inn,
      fullName: data.fullName,
    });

    const resData = res.data;
    const accessToken = resData.accessToken || resData.tokens?.accessToken || '';
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
  },

  registerEmployee: async (data: RegisterEmployeeRequest): Promise<AuthResponse> => {
    const parts = data.fullName.trim().split(/\s+/);
    const lastName = parts[0] || 'Сотрудник';
    const firstName = parts[1] || parts[0] || 'Банка';
    const middleName = parts.slice(2).join(' ') || null;

    const res = await apiClient.post<any>('/auth/employee/register', {
      username: data.username,
      password: data.password,
      firstName,
      lastName,
      middleName,
      fullName: data.fullName,
      department: data.department || 'Андеррайтинг',
    });

    const resData = res.data;
    const accessToken = resData.accessToken || resData.tokens?.accessToken || '';
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
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('smart_kabinet_access_token');
      localStorage.removeItem('smart_kabinet_refresh_token');
      localStorage.removeItem('smart_kabinet_user');
    }
  },
};
