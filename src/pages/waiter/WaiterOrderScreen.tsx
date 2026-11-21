import { useEffect, useMemo, useState } from 'react';
import * as menuApi from '@/api/menuApi';
import * as ordersApi from '@/api/ordersApi';
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    return [...map.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'tr'),
    );
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

  const selectedLines = useMemo(
    () =>
      items
        .filter((item) => (quantities[item.id] ?? 0) > 0)
        .map((item) => ({
          item,
          quantity: quantities[item.id] ?? 0,
        })),
    [items, quantities],
  );

  const selectedCount = selectedLines.reduce((sum, line) => sum + line.quantity, 0);
  const selectedTotal = selectedLines.reduce(
    (sum, line) => sum + line.item.price * line.quantity,
    0,
  );

  function setQuantity(itemId: string, next: number) {
    setQuantities((prev) => {
      if (next <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
  }

  async function handleSubmit() {
    if (selectedLines.length === 0 || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await getAccessToken();
      await ordersApi.addOrderRound(token, branchId, sessionId, {
        lines: selectedLines.map((line) => ({
          menuItemId: line.item.id,
          quantity: line.quantity,
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sipariş gönderilemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="floor-order" aria-label={`${tableName} sipariş`}>
      <div className="floor-order-bar">
        <button className="floor-text-btn" type="button" onClick={onClose} disabled={saving}>
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
            {visibleItems.map((item) => {
              const quantity = quantities[item.id] ?? 0;
              return (
                <li
                  key={item.id}
                  className={`floor-order-item${quantity > 0 ? ' is-selected' : ''}`}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.categoryName}</span>
                  </div>
                  <div className="floor-order-item-side">
                    <em>{formatLira(item.price)}</em>
                    <div className="floor-order-qty">
                      <button
                        type="button"
                        aria-label={`${item.name} azalt`}
                        disabled={quantity === 0 || saving}
                        onClick={() => setQuantity(item.id, quantity - 1)}
                      >
                        −
                      </button>
                      <span aria-live="polite">{quantity}</span>
                      <button
                        type="button"
                        aria-label={`${item.name} artır`}
                        disabled={saving}
                        onClick={() => setQuantity(item.id, quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="floor-order-footer">
        <div className="floor-order-summary">
          <strong>{selectedCount} ürün</strong>
          <span>{formatLira(selectedTotal)}</span>
        </div>
        <button
          className="floor-order-submit"
          type="button"
          disabled={selectedCount === 0 || saving}
          onClick={() => void handleSubmit()}
        >
          {saving ? 'Gönderiliyor...' : 'Siparişi gönder'}
        </button>
      </div>
    </section>
  );
}
