import { apiRequest } from './client';
import type { MenuCategoryResponse, MenuItemResponse } from './types';

export async function listMenuCategories(
  token: string,
  branchId: string,
): Promise<MenuCategoryResponse[]> {
  return apiRequest<MenuCategoryResponse[]>(
    `/branches/${branchId}/menu-categories`,
    {
      method: 'GET',
      token,
    },
  );
}

export async function listMenuItems(
  token: string,
  branchId: string,
): Promise<MenuItemResponse[]> {
  return apiRequest<MenuItemResponse[]>(`/branches/${branchId}/menu-items`, {
    method: 'GET',
    token,
  });
}
