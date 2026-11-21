import { apiRequest } from './client';
import type {
  KitchenQueueItemResponse,
  KitchenStatus,
  UpdateKitchenStatusResponse,
} from './types';

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

export async function updateKitchenStatus(
  token: string,
  branchId: string,
  orderLineId: string,
  status: KitchenStatus,
): Promise<UpdateKitchenStatusResponse> {
  return apiRequest<UpdateKitchenStatusResponse>(
    `/branches/${branchId}/order-lines/${orderLineId}/kitchen-status`,
    {
      method: 'PUT',
      token,
      body: { status },
    },
  );
}
