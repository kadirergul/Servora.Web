import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ScreenMenu } from '@/layout/ScreenMenu';

type FloorHeaderToolsProps = {
  children?: ReactNode;
};

export function FloorHeaderTools({ children }: FloorHeaderToolsProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="floor-tools">
      <ScreenMenu tone="floor" />
      {children}
      <button
        className="floor-text-btn"
        type="button"
        onClick={() => {
          void logout()
            .catch(() => undefined)
            .finally(() => navigate('/'));
        }}
      >
        Çıkış
      </button>
    </div>
  );
}
