import { apiRequest } from './client';
import type { KitchenQueueItemResponse } from './types';

export async function listKitchenQueue(
  token: string,
  branchId: string,
): Promise<KitchenQueueItemResponse[]> {
  return apiRequest<KitchenQueueItemResponse[]>(
    `/branches/${branchId}/kitchen/queue`,
    {
      method: 'GET',
      token,
    },
  );
}
