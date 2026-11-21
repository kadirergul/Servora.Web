import { useEffect, useMemo, useState } from 'react';
import * as menuApi from '@/api/menuApi';
import type { MenuItemResponse } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';

type WaiterOrderScreenProps = {
  branchId: string;
  tableName: string;
  sessionId: string;
  onClose: () => void;
};

function formatLira(value: number): string {
  return `${new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} ₺`;
}

export function WaiterOrderScreen({
  branchId,
  tableName,
  sessionId,
  onClose,
}: WaiterOrderScreenProps) {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<MenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        const list = await menuApi.listMenuItems(token, branchId);
        if (!cancelled) {
          setItems(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Menü yüklenemedi');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [branchId, getAccessToken]);

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sortOrder: number }>();
    for (const item of items) {
      if (!map.has(item.categoryId)) {
        map.set(item.categoryId, {
          id: item.categoryId,
          name: item.categoryName,
          sortOrder: item.categorySortOrder,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'tr'));
  }, [items]);

  const visibleItems = useMemo(() => {
    const filtered =
      activeCategoryId === 'all'
        ? items
        : items.filter((item) => item.categoryId === activeCategoryId);

    return [...filtered].sort(
      (a, b) =>
        a.categorySortOrder - b.categorySortOrder ||
        a.name.localeCompare(b.name, 'tr'),
    );
  }, [items, activeCategoryId]);

  return (
    <section className="floor-order" aria-label={`${tableName} sipariş`}>
      <div className="floor-order-bar">
        <button className="floor-text-btn" type="button" onClick={onClose}>
          Geri
        </button>
        <div className="floor-order-title">
          <h2>{tableName}</h2>
          <p>Sipariş menüsü</p>
        </div>
        <span className="floor-order-session" title={sessionId}>
          Oturum açık
        </span>
      </div>

      {categories.length > 0 ? (
        <div className="floor-order-cats" role="tablist" aria-label="Kategoriler">
          <button
            className={`floor-order-cat${activeCategoryId === 'all' ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeCategoryId === 'all'}
            onClick={() => setActiveCategoryId('all')}
          >
            Tümü
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`floor-order-cat${activeCategoryId === category.id ? ' is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeCategoryId === category.id}
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="floor-order-scroll">
        {error ? <p className="floor-error">{error}</p> : null}
        {loading ? (
          <p className="floor-empty">Menü yükleniyor...</p>
        ) : visibleItems.length === 0 ? (
          <p className="floor-empty">Bu şubede menü ürünü yok.</p>
        ) : (
          <ul className="floor-order-list">
            {visibleItems.map((item) => (
              <li key={item.id} className="floor-order-item">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.categoryName}</span>
                </div>
                <em>{formatLira(item.price)}</em>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
