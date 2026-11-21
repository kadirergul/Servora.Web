import { useCallback, useEffect, useMemo, useState } from 'react';
import * as branchesApi from '@/api/branchesApi';
import * as kitchenApi from '@/api/kitchenApi';
import * as tenantsApi from '@/api/tenantsApi';
import type {
  BranchResponse,
  KitchenQueueItemResponse,
  KitchenStatus,
  TenantResponse,
} from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { FloorHeaderTools } from '@/layout/FloorHeaderTools';

const FLOOR_TENANT_KEY = 'servora.floorTenantId';
const FLOOR_BRANCH_KEY = 'servora.floorBranchId';
const BRANCH_BOUND_ROLES = new Set(['Manager', 'Waiter', 'Kitchen', 'Cashier']);

function greetingForHour(hour: number): string {
  if (hour < 6) {
    return 'İyi geceler';
  }
  if (hour < 12) {
    return 'Günaydın';
  }
  if (hour < 18) {
    return 'İyi günler';
  }
  return 'İyi akşamlar';
}

function formatCount(value: number): string {
  return String(value).padStart(2, '0');
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isQueueActive(status: KitchenStatus): boolean {
  return status === 'Pending' || status === 'Preparing';
}

type KitchenTableGroup = {
  tableId: string;
  tableName: string;
  orderedAt: string;
  items: KitchenQueueItemResponse[];
};

function groupByTable(queue: KitchenQueueItemResponse[]): KitchenTableGroup[] {
  const map = new Map<string, KitchenTableGroup>();

  for (const item of queue) {
    const existing = map.get(item.tableId);
    if (!existing) {
      map.set(item.tableId, {
        tableId: item.tableId,
        tableName: item.tableName,
        orderedAt: item.orderedAt,
        items: [item],
      });
      continue;
    }

    existing.items.push(item);
    if (new Date(item.orderedAt).getTime() < new Date(existing.orderedAt).getTime()) {
      existing.orderedAt = item.orderedAt;
    }
  }

  return [...map.values()].sort(
    (a, b) => new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime(),
  );
}

export function KitchenFloorPage() {
  const { getAccessToken, role, tenantId, branchId } = useAuth();
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const isBranchBound = Boolean(role && BRANCH_BOUND_ROLES.has(role));
  const needsBranchPicker = !branchId && !isBranchBound;

  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState(() =>
    needsBranchPicker && role === 'PlatformAdmin'
      ? (sessionStorage.getItem(FLOOR_TENANT_KEY) ?? '')
      : (tenantId ?? ''),
  );
  const [selectedBranchId, setSelectedBranchId] = useState(
    () => branchId ?? sessionStorage.getItem(FLOOR_BRANCH_KEY) ?? '',
  );

  const [items, setItems] = useState<KitchenQueueItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeBranchId = isBranchBound ? (branchId ?? '') : (branchId ?? selectedBranchId);
  const groups = useMemo(() => groupByTable(items), [items]);

  useEffect(() => {
    if (branchId) {
      setSelectedBranchId(branchId);
      return;
    }

    if (role !== 'PlatformAdmin' && tenantId) {
      setSelectedTenantId(tenantId);
    }
  }, [branchId, role, tenantId]);

  useEffect(() => {
    if (!needsBranchPicker || role !== 'PlatformAdmin') {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await getAccessToken();
        const list = await tenantsApi.listTenants(token);
        if (!cancelled) {
          setTenants(list.filter((item) => item.isActive));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'İşletmeler yüklenemedi');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsBranchPicker, role, getAccessToken]);

  useEffect(() => {
    if (!needsBranchPicker) {
      return;
    }

    const tenantForBranches =
      role === 'PlatformAdmin' ? selectedTenantId : (tenantId ?? '');
    if (role === 'PlatformAdmin' && !tenantForBranches) {
      setBranches([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await getAccessToken();
        const list = await branchesApi.listBranches(
          token,
          role === 'PlatformAdmin' ? tenantForBranches : undefined,
        );
        if (cancelled) {
          return;
        }

        const active = list.filter((item) => item.isActive);
        setBranches(active);
        setSelectedBranchId((current) => {
          if (!current || active.some((branch) => branch.id === current)) {
            return current;
          }
          sessionStorage.removeItem(FLOOR_BRANCH_KEY);
          return '';
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Şubeler yüklenemedi');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsBranchPicker, role, tenantId, selectedTenantId, getAccessToken]);

  const loadQueue = useCallback(async () => {
    if (!activeBranchId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const queue = await kitchenApi.listKitchenQueue(token, activeBranchId);
      setItems(queue);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : 'Mutfak kuyruğu yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId, getAccessToken]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!activeBranchId) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadQueue();
    }, 8_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeBranchId, loadQueue]);

  async function handleMarkReady(item: KitchenQueueItemResponse) {
    if (!isQueueActive(item.kitchenStatus) || !activeBranchId || updatingId || updatingTableId) {
      return;
    }

    setUpdatingId(item.orderLineId);
    setError(null);

    try {
      const token = await getAccessToken();
      await kitchenApi.updateKitchenStatus(
        token,
        activeBranchId,
        item.orderLineId,
        'Ready',
      );
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMarkGroupReady(group: KitchenTableGroup) {
    if (!activeBranchId || updatingId || updatingTableId) {
      return;
    }

    const targets = group.items.filter((item) => isQueueActive(item.kitchenStatus));
    if (targets.length === 0) {
      return;
    }

    setUpdatingTableId(group.tableId);
    setError(null);

    try {
      const token = await getAccessToken();
      for (const item of targets) {
        await kitchenApi.updateKitchenStatus(
          token,
          activeBranchId,
          item.orderLineId,
          'Ready',
        );
      }
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi');
      await loadQueue();
    } finally {
      setUpdatingTableId(null);
    }
  }

  return (
    <>
      <header className="floor-header">
        <div className="floor-brand-block">
          <p className="floor-logo">SERVORA</p>
          <p className="floor-kicker">Mutfak Yönetim Paneli</p>
        </div>

        <div className="floor-greet">
          <h1>
            {greeting} <span aria-hidden="true">👋</span>
          </h1>
          <p>Siparişleri sırayla hazırla.</p>
        </div>

        <div className="floor-header-side">
          <span className="floor-online">
            <span className="floor-online-dot" aria-hidden="true" />
            Çevrimiçi
          </span>
          <FloorHeaderTools>
            <button
              className="floor-text-btn"
              type="button"
              disabled={loading || !activeBranchId}
              onClick={() => void loadQueue()}
            >
              Yenile
            </button>
          </FloorHeaderTools>
        </div>
      </header>

      <div className="floor-body">
        <div className="floor-scroll">
          {needsBranchPicker ? (
            <section className="floor-branch-bar" aria-label="Şube seçimi">
              {role === 'PlatformAdmin' ? (
                <label className="floor-branch-field">
                  <span>İşletme</span>
                  <select
                    value={selectedTenantId}
                    onChange={(event) => {
                      const next = event.target.value;
                      setSelectedTenantId(next);
                      setSelectedBranchId('');
                      sessionStorage.setItem(FLOOR_TENANT_KEY, next);
                      sessionStorage.removeItem(FLOOR_BRANCH_KEY);
                    }}
                  >
                    <option value="">İşletme seç</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="floor-branch-field">
                <span>Şube</span>
                <select
                  value={selectedBranchId}
                  disabled={role === 'PlatformAdmin' && !selectedTenantId}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSelectedBranchId(next);
                    sessionStorage.setItem(FLOOR_BRANCH_KEY, next);
                  }}
                >
                  <option value="">
                    {role === 'PlatformAdmin' && !selectedTenantId
                      ? 'Önce işletme seç'
                      : 'Şube seç'}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          ) : null}

          {error ? <p className="floor-error">{error}</p> : null}

          {!activeBranchId ? (
            <p className="floor-empty">
              {isBranchBound
                ? 'Bu hesap bir şubeye bağlı değil. Yöneticiye haber ver.'
                : 'Kuyruğu görmek için şube seç.'}
            </p>
          ) : (
            <>
              <section className="floor-stats" aria-label="Mutfak özeti">
                <article className="floor-stat">
                  <span>Hazırlanıyor</span>
                  <strong>{formatCount(items.length)}</strong>
                </article>
                <article className="floor-stat">
                  <span>Masa</span>
                  <strong>{formatCount(groups.length)}</strong>
                </article>
              </section>

              <section className="floor-board" aria-label="Mutfak kuyruğu">
                <div className="floor-board-head">
                  <h2>Sipariş kuyruğu</h2>
                </div>

                {loading && items.length === 0 ? (
                  <p className="floor-empty">Kuyruk yükleniyor...</p>
                ) : groups.length === 0 ? (
                  <p className="floor-empty">Şu an bekleyen sipariş yok.</p>
                ) : (
                  <ul className="floor-kitchen-list">
                    {groups.map((group) => {
                      const busy =
                        updatingTableId === group.tableId || updatingId !== null;

                      return (
                        <li
                          key={group.tableId}
                          className="floor-kitchen-group is-preparing"
                        >
                          <div className="floor-kitchen-group-head">
                            <div className="floor-kitchen-meta">
                              <strong>{group.tableName}</strong>
                              <span className="floor-detail-status is-preparing">
                                Hazırlanıyor
                              </span>
                              <span className="floor-kitchen-time">
                                {formatTime(group.orderedAt)} · {group.items.length} kalem
                              </span>
                            </div>
                            <div className="floor-kitchen-group-actions">
                              <button
                                className="floor-kitchen-action"
                                type="button"
                                disabled={busy}
                                onClick={() => void handleMarkGroupReady(group)}
                              >
                                {updatingTableId === group.tableId
                                  ? '...'
                                  : group.items.length === 1
                                    ? 'Hazır'
                                    : 'Hepsini hazır'}
                              </button>
                            </div>
                          </div>

                          <ul className="floor-kitchen-lines">
                            {group.items.map((item) => (
                              <li key={item.orderLineId} className="floor-kitchen-line">
                                <div className="floor-kitchen-main">
                                  <div className="floor-kitchen-meta">
                                    <span className="floor-detail-status is-preparing">
                                      Hazırlanıyor
                                    </span>
                                    <span className="floor-kitchen-time">
                                      {formatTime(item.orderedAt)}
                                    </span>
                                  </div>
                                  <p className="floor-kitchen-name">
                                    {item.quantity}× {item.name}
                                  </p>
                                  {item.note ? (
                                    <p className="floor-kitchen-note">{item.note}</p>
                                  ) : null}
                                </div>
                                <button
                                  className="floor-kitchen-action is-ghost"
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void handleMarkReady(item)}
                                >
                                  {updatingId === item.orderLineId ? '...' : 'Hazır'}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
