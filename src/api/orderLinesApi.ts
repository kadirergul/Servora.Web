import { apiRequest } from './client';

export type UpdateOrderLineRequest = {
  quantity: number;
  note?: string | null;
};

export async function updateOrderLine(
  token: string,
  branchId: string,
  orderLineId: string,
  request: UpdateOrderLineRequest,
): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(
    `/branches/${branchId}/order-lines/${orderLineId}`,
    {
      method: 'PUT',
      token,
      body: request,
    },
  );
}

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

export async function requestOrderLineCancel(
  token: string,
  branchId: string,
  orderLineId: string,
  note?: string | null,
): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(
    `/branches/${branchId}/order-lines/${orderLineId}/cancel-request`,
    {
      method: 'POST',
      token,
      body: { note: note ?? null },
    },
  );
}
