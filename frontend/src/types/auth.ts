export type UserRole = 'Client' | 'BankEmployee';

export function normalizeRole(rawRole: any): UserRole {
  if (!rawRole) return 'Client';
  const str = String(rawRole).trim().toLowerCase();
  if (
    str === 'bankemployee' ||
    str === 'analyst' ||
    str === 'admin' ||
    str === '3' ||
    str === '1'
  ) {
    return 'BankEmployee';
  }
  return 'Client';
}

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  inn?: string;
  fullName?: string;
  companyName?: string;
  department?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterClientRequest {
  username: string;
  password: string;
  inn: string;
  fullName: string;
}

export interface RegisterEmployeeRequest {
  username: string;
  password: string;
  fullName: string;
  department?: string;
}
