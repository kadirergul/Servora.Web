import type { AuthResponse, Role } from '@/api/types';

export const PREVIEW_REFRESH_TOKEN = 'preview';

const PREVIEW_HOURS = 12;

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Local session so the shell can render while the API is down. */
export function createPreviewAuth(role: Role): AuthResponse {
  const expiresAt = new Date(Date.now() + PREVIEW_HOURS * 60 * 60 * 1000).toISOString();
  const header = toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      role,
      sub: 'preview',
      unique_name: 'preview',
    }),
  );

  return {
    accessToken: `${header}.${payload}.preview`,
    refreshToken: PREVIEW_REFRESH_TOKEN,
    expiresAt,
    refreshExpiresAt: expiresAt,
  };
}
