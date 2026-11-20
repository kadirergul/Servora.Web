import { apiRequest } from './client';
import type { TenantResponse } from './types';

export async function listTenants(token: string): Promise<TenantResponse[]> {
  return apiRequest<TenantResponse[]>('/tenants', {
    method: 'GET',
    token,
  });
}
