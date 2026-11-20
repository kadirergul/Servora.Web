import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { homePathForRole } from '@/auth/roles';
import { AppShell } from '@/layout/AppShell';

export function AuthenticatedLayout() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role === 'Waiter') {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return (
    <AppShell showSidebar>
      <Outlet />
    </AppShell>
  );
}
