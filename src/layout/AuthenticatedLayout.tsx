import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { homePathForRole } from '@/auth/roles';
import { AppShell } from '@/layout/AppShell';

const FLOOR_ROLES: readonly Role[] = ['Waiter', 'Kitchen', 'Cashier'];

export function AuthenticatedLayout() {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (role && FLOOR_ROLES.includes(role)) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return (
    <AppShell showSidebar>
      <Outlet />
    </AppShell>
  );
}
