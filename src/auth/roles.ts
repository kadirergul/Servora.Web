import type { Role } from '@/api/types';

/** Roles that can open the Users management screen. */
export const USER_MANAGER_ROLES: readonly Role[] = [
  'PlatformAdmin',
  'Owner',
  'Manager',
];

/** Roles that can open the waiter floor. */
export const WAITER_FLOOR_ROLES: readonly Role[] = [
  'PlatformAdmin',
  'Owner',
  'Manager',
  'Waiter',
];

/** Roles that can open the kitchen floor. */
export const KITCHEN_FLOOR_ROLES: readonly Role[] = [
  'PlatformAdmin',
  'Owner',
  'Manager',
  'Kitchen',
];

/** Roles that can open the cashier floor. */
export const CASHIER_FLOOR_ROLES: readonly Role[] = [
  'PlatformAdmin',
  'Owner',
  'Manager',
  'Cashier',
];

const APP_PATHS: readonly { prefix: string; roles: readonly Role[] }[] = [
  { prefix: '/garson', roles: WAITER_FLOOR_ROLES },
  { prefix: '/mutfak', roles: KITCHEN_FLOOR_ROLES },
  { prefix: '/kasa', roles: CASHIER_FLOOR_ROLES },
  { prefix: '/tanimlamalar/kullanicilar', roles: USER_MANAGER_ROLES },
  { prefix: '/yonetim', roles: USER_MANAGER_ROLES },
  { prefix: '/raporlar', roles: USER_MANAGER_ROLES },
  { prefix: '/tanimlamalar', roles: USER_MANAGER_ROLES },
];

export function canManageUsers(role: Role | null | undefined): boolean {
  return Boolean(role && USER_MANAGER_ROLES.includes(role));
}

export function homePathForRole(role: Role | null | undefined): string {
  switch (role) {
    case 'Waiter':
      return '/garson';
    case 'Kitchen':
      return '/mutfak';
    case 'Cashier':
      return '/kasa';
    default:
      return '/yonetim';
  }
}

export function canOpenPath(role: Role | null | undefined, path: string): boolean {
  if (!role || !path.startsWith('/') || path.startsWith('//')) {
    return false;
  }

  const match = APP_PATHS.find(
    (entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`),
  );
  return Boolean(match?.roles.includes(role));
}

export function pathAfterLogin(
  role: Role | null | undefined,
  requestedPath: string | null,
): string {
  if (requestedPath && canOpenPath(role, requestedPath)) {
    return requestedPath;
  }

  return homePathForRole(role);
}

export function getAssignableRoles(actorRole: Role | null | undefined): Role[] {
  switch (actorRole) {
    case 'PlatformAdmin':
      return ['PlatformAdmin', 'Owner', 'Manager', 'Waiter', 'Kitchen', 'Cashier'];
    case 'Owner':
      return ['Owner', 'Manager', 'Waiter', 'Kitchen', 'Cashier'];
    case 'Manager':
      return ['Manager', 'Waiter', 'Kitchen', 'Cashier'];
    default:
      return [];
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  PlatformAdmin: 'Platform Yöneticisi',
  Owner: 'İşletme Sahibi',
  Manager: 'Şube Yöneticisi',
  Waiter: 'Garson',
  Kitchen: 'Mutfak',
  Cashier: 'Kasa',
};
