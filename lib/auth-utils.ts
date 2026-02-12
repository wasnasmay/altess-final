export type UserRole = 'admin' | 'organizer' | 'partner' | 'provider' | 'client';

export const ROLE_PATHS: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  organizer: '/organizer-dashboard-premium',
  partner: '/partner-dashboard',
  provider: '/provider-dashboard',
  client: '/client-dashboard'
};

export function getRoleRedirectPath(role: string): string {
  const normalizedRole = role.toLowerCase() as UserRole;
  return ROLE_PATHS[normalizedRole] || ROLE_PATHS.client;
}

export function isValidRole(role: string): role is UserRole {
  return ['admin', 'organizer', 'partner', 'provider', 'client'].includes(role.toLowerCase());
}

export function redirectToRoleDashboard(role: string): void {
  const path = getRoleRedirectPath(role);
  window.location.href = path;
}

export function shouldRedirectFromLogin(
  userRole: string | undefined,
  currentPath: string
): boolean {
  if (!userRole || currentPath !== '/login') return false;
  return true;
}
