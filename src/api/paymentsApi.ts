import { apiRequest } from './client';
import type { TakePaymentRequest, TakePaymentResponse } from './types';

export async function takePayment(
  token: string,
  branchId: string,
  sessionId: string,
  request: TakePaymentRequest,
): Promise<TakePaymentResponse> {
  return apiRequest<TakePaymentResponse>(
    `/branches/${branchId}/sessions/${sessionId}/payments`,
    {
      method: 'POST',
      token,
      body: request,
    },
  );
}
