import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiRequestError } from '@/api/client';
import * as branchesApi from '@/api/branchesApi';
import * as kitchenApi from '@/api/kitchenApi';
import * as tablesApi from '@/api/tablesApi';
import * as tenantsApi from '@/api/tenantsApi';
import type { BranchResponse, TableResponse, TenantResponse } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { FloorHeaderTools } from '@/layout/FloorHeaderTools';

type FloorTableStatus = 'empty' | 'occupied' | 'ready';

type FloorTable = {
  id: string;
  name: string;
  status: FloorTableStatus;
  sessionId: string | null;
};

const STATUS_LABEL: Record<FloorTableStatus, string> = {
  empty: 'Boş',
  occupied: 'Dolu',
  ready: 'Hazır',
};

const FLOOR_TENANT_KEY = 'servora.floorTenantId';
const FLOOR_BRANCH_KEY = 'servora.floorBranchId';

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

function tableDetail(table: FloorTable): string {
  if (table.status === 'empty') {
    return 'Müşteri bekliyor';
  }

  if (table.status === 'ready') {
    return 'Sipariş hazır';
  }

  return 'Masa açık';
}

function toFloorTables(
  tables: TableResponse[],
  readyTableIds: Set<string>,
): FloorTable[] {
  return tables.map((table) => {
    let status: FloorTableStatus = 'empty';
    if (readyTableIds.has(table.id)) {
      status = 'ready';
    } else if (table.isOccupied) {
      status = 'occupied';
    }

    return {
      id: table.id,
      name: table.name,
      status,
      sessionId: table.sessionId,
    };
  });
}

const BRANCH_BOUND_ROLES = new Set(['Manager', 'Waiter', 'Kitchen', 'Cashier']);

export function WaiterFloorPage() {
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

  const [tables, setTables] = useState<FloorTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(true);

  const activeBranchId = isBranchBound ? (branchId ?? '') : (branchId ?? selectedBranchId);
  const selected =
    tables.find((table) => table.id === selectedId) ?? tables[0] ?? null;
  const emptyCount = tables.filter((table) => table.status === 'empty').length;
  const occupiedCount = tables.filter((table) => table.status !== 'empty').length;
  const readyCount = tables.filter((table) => table.status === 'ready').length;

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

  const loadTables = useCallback(async () => {
    if (!activeBranchId) {
      setTables([]);
      setSelectedId(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const [tableList, readyTableIds] = await Promise.all([
        tablesApi.listTables(token, activeBranchId),
        (async () => {
          try {
            const queue = await kitchenApi.listKitchenQueue(token, activeBranchId);
            return new Set(
              queue
                .filter((item) => item.kitchenStatus === 'Ready')
                .map((item) => item.tableId),
            );
          } catch (err) {
            if (
              err instanceof ApiRequestError &&
              (err.status === 400 || err.status === 404)
            ) {
              return new Set<string>();
            }
            throw err;
          }
        })(),
      ]);

      const nextTables = toFloorTables(tableList, readyTableIds);
      setTables(nextTables);
      setSelectedId((current) => {
        if (current && nextTables.some((table) => table.id === current)) {
          return current;
        }
        return nextTables[0]?.id ?? null;
      });
    } catch (err) {
      setTables([]);
      setError(err instanceof Error ? err.message : 'Masalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId, getAccessToken]);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  return (
    <>
      <header className="floor-header">
        <div className="floor-brand-block">
          <p className="floor-logo">SERVORA</p>
          <p className="floor-kicker">Garson Yönetim Paneli</p>
        </div>

        <div className="floor-greet">
          <h1>
            {greeting} <span aria-hidden="true">👋</span>
          </h1>
          <p>Bugün güzel bir servis günü!</p>
        </div>

        <div className="floor-header-side">
          <span className="floor-online">
            <span className="floor-online-dot" aria-hidden="true" />
            Çevrimiçi
          </span>
          <FloorHeaderTools>
            <button className="floor-icon-btn" type="button" aria-label="Bildirimler">
              <BellIcon />
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
                : 'Masaları görmek için şube seç.'}
            </p>
          ) : loading && tables.length === 0 ? (
            <p className="floor-empty">Masalar yükleniyor...</p>
          ) : tables.length === 0 ? (
            <p className="floor-empty">Bu şubede henüz masa yok.</p>
          ) : (
            <>
              <section className="floor-stats" aria-label="Masa özeti">
                <article className="floor-stat">
                  <span>Boş masa</span>
                  <strong>{formatCount(emptyCount)}</strong>
                </article>
                <article className="floor-stat">
                  <span>Dolu masa</span>
                  <strong>{formatCount(occupiedCount)}</strong>
                </article>
                <article className="floor-stat">
                  <span>Hazır sipariş</span>
                  <strong>{formatCount(readyCount)}</strong>
                </article>
              </section>

              <section className="floor-board" aria-label="Masa durumu">
                <div className="floor-board-head">
                  <h2>Masa durumu</h2>
                  <ul className="floor-legend">
                    <li>
                      <span className="floor-dot is-empty" aria-hidden="true" />
                      Boş
                    </li>
                    <li>
                      <span className="floor-dot is-occupied" aria-hidden="true" />
                      Dolu
                    </li>
                    <li>
                      <span className="floor-dot is-ready" aria-hidden="true" />
                      Hazır
                    </li>
                  </ul>
                </div>

                <div className="floor-grid">
                  {tables.map((table) => {
                    const isSelected = selected?.id === table.id;
                    return (
                      <button
                        key={table.id}
                        className={`floor-table is-${table.status}${isSelected ? ' is-selected' : ''}`}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedId(table.id);
                          setActionsOpen(true);
                        }}
                      >
                        <span className="floor-table-top">
                          <TableMark />
                          <span className={`floor-badge is-${table.status}`}>
                            {STATUS_LABEL[table.status]}
                          </span>
                        </span>
                        <span className="floor-table-name">{table.name}</span>
                        <span className="floor-table-detail">{tableDetail(table)}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>

        <section
          className={`floor-actions${actionsOpen ? '' : ' is-collapsed'}`}
          aria-label="Masa işlemleri"
        >
          <div className="floor-actions-copy">
            <h2>
              {selected ? selected.name : 'Masa seç'}
              <span> – Masa işlemleri</span>
            </h2>
            {actionsOpen ? (
              <p>
                {selected
                  ? 'Seçilen masada yapılabilecek işlemler'
                  : 'İşlem için bir masa seç'}
              </p>
            ) : null}
          </div>

          {actionsOpen ? (
            <div className="floor-actions-body">
              <button className="floor-order-btn" type="button" disabled={!selected}>
                + Sipariş al
              </button>
              <div className="floor-action-row">
                <button className="floor-ghost-btn" type="button" disabled={!selected}>
                  Hesap
                </button>
                <button className="floor-ghost-btn" type="button" disabled={!selected}>
                  Detaylar
                </button>
              </div>
            </div>
          ) : null}

          <button
            className="floor-collapse"
            type="button"
            aria-expanded={actionsOpen}
            aria-label={actionsOpen ? 'İşlem panelini gizle' : 'İşlem panelini göster'}
            onClick={() => setActionsOpen((open) => !open)}
          >
            <ChevronIcon direction={actionsOpen ? 'down' : 'up'} />
          </button>
        </section>
      </div>
    </>
  );
}

function TableMark() {
  return (
    <svg className="floor-table-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 9.5A2.5 2.5 0 0 1 6.5 7h11A2.5 2.5 0 0 1 20 9.5v1.2a1.3 1.3 0 0 1-1.1 1.28L18 14.5V18a1 1 0 1 1-2 0v-3H8v3a1 1 0 1 1-2 0v-3.5l-.9-2.52A1.3 1.3 0 0 1 4 10.7V9.5Zm2.2 2.3h11.6l.5-1.4a.5.5 0 0 0-.47-.66h-11.66a.5.5 0 0 0-.47.66l.5 1.4Z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 16.5h12l-1.2-1.6V10a4.8 4.8 0 0 0-9.6 0v4.9L6 16.5Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M10 18.5a2 2 0 0 0 4 0"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === 'down' ? 'M6 9.5 12 15.5 18 9.5' : 'M6 14.5 12 8.5 18 14.5'}
      />
    </svg>
  );
}
