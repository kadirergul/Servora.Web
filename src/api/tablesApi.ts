import { apiRequest } from './client';
import type { TableResponse } from './types';

export async function listTables(
  token: string,
  branchId: string,
): Promise<TableResponse[]> {
  return apiRequest<TableResponse[]>(`/branches/${branchId}/tables`, {
    method: 'GET',
    token,
  });
}
