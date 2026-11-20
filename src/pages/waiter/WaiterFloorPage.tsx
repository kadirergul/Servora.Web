import { useMemo, useState } from 'react';
import { FloorHeaderTools } from '@/layout/FloorHeaderTools';

type FloorTableStatus = 'empty' | 'occupied' | 'ready';

type FloorTable = {
  id: string;
  name: string;
  status: FloorTableStatus;
  guestCount: number | null;
  total: number | null;
};

const STATUS_LABEL: Record<FloorTableStatus, string> = {
  empty: 'Boş',
  occupied: 'Dolu',
  ready: 'Hazır',
};

/** Yerleşim önizlemesi. Masa listesi sonraki adımda API'den gelecek. */
const PREVIEW_TABLES: FloorTable[] = [
  { id: '1', name: 'Masa 01', status: 'empty', guestCount: null, total: null },
  { id: '2', name: 'Masa 02', status: 'occupied', guestCount: 3, total: 420 },
  { id: '3', name: 'Masa 03', status: 'ready', guestCount: 2, total: 180 },
  { id: '4', name: 'Masa 04', status: 'occupied', guestCount: 4, total: 850 },
  { id: '5', name: 'Masa 05', status: 'empty', guestCount: null, total: null },
  { id: '6', name: 'Masa 06', status: 'occupied', guestCount: 2, total: 310 },
  { id: '7', name: 'Masa 07', status: 'occupied', guestCount: 5, total: 1250 },
  { id: '8', name: 'Masa 08', status: 'empty', guestCount: null, total: null },
];

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

function formatLira(value: number): string {
  return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)} ₺`;
}

function tableDetail(table: FloorTable): string {
  if (table.status === 'empty' || table.guestCount === null) {
    return 'Müşteri bekliyor';
  }

  if (table.status === 'ready') {
    return `${table.guestCount} kişi · Sipariş hazır`;
  }

  return `${table.guestCount} kişi · ${formatLira(table.total ?? 0)}`;
}

export function WaiterFloorPage() {
  const [selectedId, setSelectedId] = useState(PREVIEW_TABLES[6]?.id ?? PREVIEW_TABLES[0].id);
  const [actionsOpen, setActionsOpen] = useState(true);
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  const selected = PREVIEW_TABLES.find((table) => table.id === selectedId) ?? PREVIEW_TABLES[0];
  const emptyCount = PREVIEW_TABLES.filter((table) => table.status === 'empty').length;
  const occupiedCount = PREVIEW_TABLES.filter((table) => table.status !== 'empty').length;
  const readyCount = PREVIEW_TABLES.filter((table) => table.status === 'ready').length;

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
              {PREVIEW_TABLES.map((table) => {
                const isSelected = table.id === selected.id;
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
        </div>

        <section
          className={`floor-actions${actionsOpen ? '' : ' is-collapsed'}`}
          aria-label="Masa işlemleri"
        >
          <div className="floor-actions-copy">
            <h2>
              {selected.name}
              <span> – Masa işlemleri</span>
            </h2>
            {actionsOpen ? <p>Seçilen masada yapılabilecek işlemler</p> : null}
          </div>

          {actionsOpen ? (
            <div className="floor-actions-body">
              <button className="floor-order-btn" type="button">
                + Sipariş al
              </button>
              <div className="floor-action-row">
                <button className="floor-ghost-btn" type="button">
                  Hesap
                </button>
                <button className="floor-ghost-btn" type="button">
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
