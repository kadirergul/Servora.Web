export type Role =
  | 'PlatformAdmin'
  | 'Owner'
  | 'Manager'
  | 'Waiter'
  | 'Kitchen'
  | 'Cashier';

export type AuthResponse = {
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
};

export type LoginRequest = {
  userName: string;
  password: string;
};

export type UserResponse = {
  id: string;
  name: string;
  userName: string;
  role: Role;
  tenantId: string | null;
  isActive: boolean;
};

export type CreateUserRequest = {
  name: string;
  userName: string;
  password: string;
  role: Role;
  tenantId?: string | null;
  branchId?: string | null;
};

export type CreateUserResponse = {
  id: string;
};

export type UpdateUserRequest = {
  name: string;
  isActive: boolean;
  role: Role;
  password?: string | null;
};

export type TenantResponse = {
  id: string;
  name: string;
  isActive: boolean;
};

export type BranchResponse = {
  id: string;
  name: string;
  usesKitchen: boolean;
  isActive: boolean;
};

export type TableResponse = {
  id: string;
  name: string;
  isOccupied: boolean;
  hasPendingOrder: boolean;
  hasPreparingOrder: boolean;
  hasReadyOrder: boolean;
  hasCancelRequest: boolean;
  sessionId: string | null;
  openedAt: string | null;
};

export type OpenTableSessionResponse = {
  id: string;
};

export type MenuCategoryResponse = {
  id: string;
  name: string;
  sortOrder: number;
};

export type MenuItemResponse = {
  id: string;
  categoryId: string;
  categoryName: string;
  categorySortOrder: number;
  name: string;
  price: number;
};

export type OrderLineInput = {
  menuItemId: string;
  quantity: number;
  note?: string | null;
};

export type AddOrderRoundRequest = {
  lines: OrderLineInput[];
};

export type AddOrderRoundResponse = {
  id: string;
};

export type KitchenStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';

export type TableSessionStatus = 'Open' | 'Closed' | 'Cancelled';

export type TableSessionLineResponse = {
  id: string;
  orderRoundId: string;
  menuItemId: string;
  name: string;
  note: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  kitchenStatus: KitchenStatus;
  cancelRequested: boolean;
};

export type TableSessionDetailResponse = {
  id: string;
  tableId: string;
  status: TableSessionStatus;
  total: number;
  paid: number;
  remaining: number;
  lines: TableSessionLineResponse[];
};

export type PaymentMethod = 'Cash' | 'Card';

export type TakePaymentRequest = {
  method: PaymentMethod;
  amount?: number | null;
};

export type TakePaymentResponse = {
  id: string;
  amount: number;
  remaining: number;
  sessionClosed: boolean;
};

export type KitchenQueueItemResponse = {
  orderLineId: string;
  tableId: string;
  tableName: string;
  sessionId: string;
  name: string;
  note: string;
  quantity: number;
  kitchenStatus: KitchenStatus;
  cancelRequested: boolean;
  orderedAt: string;
};

export type UpdateKitchenStatusRequest = {
  status: KitchenStatus;
};

export type UpdateKitchenStatusResponse = {
  id: string;
};

export type ApiError = {
  title?: string;
  detail?: string;
  status?: number;
};
