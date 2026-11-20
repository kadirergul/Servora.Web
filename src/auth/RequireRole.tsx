import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { homePathForRole } from '@/auth/roles';

type RequireRoleProps = {
  roles: readonly Role[];
  children: ReactNode;
  fallbackTo?: string;
};

export function RequireRole({ roles, children, fallbackTo }: RequireRoleProps) {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to={fallbackTo ?? homePathForRole(role)} replace />;
  }

  return children;
}
