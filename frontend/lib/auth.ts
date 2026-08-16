// frontend/lib/auth.ts

import { UserRole, UserInfo } from '@/types/auth';

export type { UserRole, UserInfo };

interface JwtPayload {
  'cognito:groups'?: string[];
  'custom:role'?: string;
  'custom:department'?: string;
  'cognito:username'?: string;
  username?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

// Helper 1: Safely decode JWT token payload using unknown instead of any
const decodeTokenPayload = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.codePointAt(0)?.toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (e) {
    console.error('Failed to parse accessToken payload:', e);
    return null;
  }
};

// Helper 2: Resolve role from Cognito groups and custom role attribute
const resolveUserRole = (payload: JwtPayload): UserRole => {
  const groups = payload['cognito:groups'] || [];
  const lowerGroups = new Set(groups.map((g) => g.toLowerCase()));
  
  let role: UserRole = 'dev';

  if (lowerGroups.has('admins') || lowerGroups.has('admin')) {
    role = 'admin';
  } else if (lowerGroups.has('finops')) {
    role = 'finops';
  } else if (lowerGroups.has('finance')) {
    role = 'finance';
  } else if (lowerGroups.has('leads') || lowerGroups.has('lead') || lowerGroups.has('devlead')) {
    role = 'lead';
  }

  const customRole = payload['custom:role'];
  if (customRole) {
    const cRole = String(customRole).toLowerCase();
    if (['admin', 'finance', 'finops', 'lead', 'dev'].includes(cRole)) {
      role = cRole as UserRole;
    }
  }

  return role;
};

export function getUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  const payload = decodeTokenPayload(token);
  if (!payload) return null;

  let role = resolveUserRole(payload);
  let department = 'All';

  const customDept = payload['custom:department'];
  if (customDept) {
    department = String(customDept);
    const deptLower = department.toLowerCase();
    if (deptLower.includes('finops') && role !== 'admin') {
      role = 'finops';
    } else if (deptLower.includes('finance') && role !== 'admin') {
      role = 'finance';
    }
  }

  const groups = payload['cognito:groups'] || [];
  const emailOrUser = payload['name'] || payload['email'] || payload['cognito:username'] || payload['username'] || 'User';

  return {
    username: String(emailOrUser),
    email: payload['email'] ? String(payload['email']) : '',
    role,
    department,
    groups,
  };
}