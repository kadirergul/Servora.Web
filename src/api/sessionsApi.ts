import { apiRequest } from './client';
import type { OpenTableSessionResponse, TableSessionDetailResponse } from './types';

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

export async function getTableSession(
  token: string,
  branchId: string,
  sessionId: string,
): Promise<TableSessionDetailResponse> {
  return apiRequest<TableSessionDetailResponse>(
    `/branches/${branchId}/sessions/${sessionId}`,
    {
      method: 'GET',
      token,
    },
  );
}
