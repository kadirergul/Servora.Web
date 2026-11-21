import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from '@/auth/RequireRole';
import {
  CASHIER_FLOOR_ROLES,
  KITCHEN_FLOOR_ROLES,
  USER_MANAGER_ROLES,
  WAITER_FLOOR_ROLES,
} from '@/auth/roles';
import { AuthenticatedLayout } from '@/layout/AuthenticatedLayout';
import { FloorLayout } from '@/layout/FloorLayout';
import { CashierFloorPage } from '@/pages/cashier/CashierFloorPage';
import { FloorSoonPage } from '@/pages/FloorSoonPage';
import { LoginPage } from '@/pages/LoginPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { UsersPage } from '@/pages/UsersPage';
import { WaiterFloorPage } from '@/pages/waiter/WaiterFloorPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/masa-takip" element={<Navigate to="/yonetim" replace />} />

      <Route element={<FloorLayout />}>
        <Route
          path="/garson"
          element={
            <RequireRole roles={WAITER_FLOOR_ROLES}>
              <WaiterFloorPage />
            </RequireRole>
          }
        />
        <Route
          path="/mutfak"
          element={
            <RequireRole roles={KITCHEN_FLOOR_ROLES}>
              <FloorSoonPage
                title="Mutfak"
                description="Mutfak kuyruğu bu adreste açılacak."
              />
            </RequireRole>
          }
        />
        <Route
          path="/kasa"
          element={
            <RequireRole roles={CASHIER_FLOOR_ROLES}>
              <CashierFloorPage />
            </RequireRole>
          }
        />
      </Route>

      <Route element={<AuthenticatedLayout />}>
        <Route
          path="/yonetim"
          element={
            <PlaceholderPage
              title="Yönetici"
              description="Raporlar ve tanımlamalar bu alandan açılır."
            />
          }
        />
        <Route
          path="/raporlar/gunluk"
          element={<PlaceholderPage title="Günlük Özet" />}
        />
        <Route
          path="/raporlar/satis"
          element={<PlaceholderPage title="Satış Raporu" />}
        />
        <Route
          path="/tanimlamalar/masalar"
          element={<PlaceholderPage title="Masalar" />}
        />
        <Route
          path="/tanimlamalar/menu"
          element={<PlaceholderPage title="Menü" />}
        />
        <Route
          path="/tanimlamalar/kullanicilar"
          element={
            <RequireRole roles={USER_MANAGER_ROLES}>
              <UsersPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
