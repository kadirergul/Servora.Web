import { apiRequest } from './client';
import type { BranchResponse } from './types';

export async function listBranches(
  token: string,
  tenantId?: string | null,
): Promise<BranchResponse[]> {
  const query =
    tenantId && tenantId.length > 0
      ? `?tenantId=${encodeURIComponent(tenantId)}`
      : '';

  return apiRequest<BranchResponse[]>(`/branches${query}`, {
    method: 'GET',
    token,
  });
}
