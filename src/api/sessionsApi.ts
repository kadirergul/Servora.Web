import { apiRequest } from './client';
import type { OpenTableSessionResponse } from './types';

export async function openTableSession(
  token: string,
  branchId: string,
  tableId: string,
): Promise<OpenTableSessionResponse> {
  return apiRequest<OpenTableSessionResponse>(
    `/branches/${branchId}/tables/${tableId}/sessions`,
    {
      method: 'POST',
      token,
    },
  );
}
