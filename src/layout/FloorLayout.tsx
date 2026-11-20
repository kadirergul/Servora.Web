import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { homePathForRole, WAITER_FLOOR_ROLES } from '@/auth/roles';
import '@/styles/floor.css';

export function FloorLayout() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!role || !WAITER_FLOOR_ROLES.includes(role)) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return (
    <div className="floor">
      <Outlet />
    </div>
  );
}
