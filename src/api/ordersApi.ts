import { apiRequest } from './client';
import type { AddOrderRoundRequest, AddOrderRoundResponse } from './types';

export async function addOrderRound(
  token: string,
  branchId: string,
  sessionId: string,
  request: AddOrderRoundRequest,
): Promise<AddOrderRoundResponse> {
  return apiRequest<AddOrderRoundResponse>(
    `/branches/${branchId}/sessions/${sessionId}/rounds`,
    {
      method: 'POST',
      token,
      body: request,
    },
  );
}
