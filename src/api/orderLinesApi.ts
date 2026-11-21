import { apiRequest } from './client';

export async function cancelOrderLine(
  token: string,
  branchId: string,
  orderLineId: string,
): Promise<void> {
  await apiRequest<void>(`/branches/${branchId}/order-lines/${orderLineId}`, {
    method: 'DELETE',
    token,
  });
}
