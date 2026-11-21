import { useEffect, useState } from 'react';
import * as sessionsApi from '@/api/sessionsApi';
import type { KitchenStatus, TableSessionDetailResponse } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';

type WaiterSessionDetailScreenProps = {
  branchId: string;
  tableName: string;
  sessionId: string;
  onClose: () => void;
};

const KITCHEN_STATUS_LABEL: Record<KitchenStatus, string> = {
  Pending: 'Bekliyor',
  Preparing: 'Hazırlanıyor',
  Ready: 'Hazır',
  Served: 'Servis edildi',
};

function formatLira(value: number): string {
  return `${new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} ₺`;
}

export function WaiterSessionDetailScreen({
  branchId,
  tableName,
  sessionId,
  onClose,
}: WaiterSessionDetailScreenProps) {
  const { getAccessToken } = useAuth();
  const [detail, setDetail] = useState<TableSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        const next = await sessionsApi.getTableSession(token, branchId, sessionId);
        if (!cancelled) {
          setDetail(next);
        }
      } catch (err) {
        if (!cancelled) {
          setDetail(null);
          setError(err instanceof Error ? err.message : 'Detaylar yüklenemedi');
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
  }, [branchId, sessionId, getAccessToken]);

  return (
    <section className="floor-order" aria-label={`${tableName} detay`}>
      <div className="floor-order-bar">
        <button className="floor-text-btn" type="button" onClick={onClose}>
          Geri
        </button>
        <div className="floor-order-title">
          <h2>{tableName}</h2>
          <p>Sipariş detayları</p>
        </div>
        <span className="floor-order-session" title={sessionId}>
          {detail?.status === 'Open' ? 'Oturum açık' : detail?.status ?? 'Oturum'}
        </span>
      </div>

      <div className="floor-order-scroll">
        {error ? <p className="floor-error">{error}</p> : null}
        {loading ? (
          <p className="floor-empty">Detaylar yükleniyor...</p>
        ) : !detail ? (
          <p className="floor-empty">Oturum bulunamadı.</p>
        ) : detail.lines.length === 0 ? (
          <p className="floor-empty">Bu masada henüz sipariş yok.</p>
        ) : (
          <ul className="floor-detail-list">
            {detail.lines.map((line) => (
              <li key={line.id} className="floor-detail-item">
                <div className="floor-detail-main">
                  <strong>
                    {line.quantity}× {line.name}
                  </strong>
                  {line.note ? <span className="floor-detail-note">{line.note}</span> : null}
                  <span
                    className={`floor-detail-status is-${line.kitchenStatus.toLowerCase()}`}
                  >
                    {KITCHEN_STATUS_LABEL[line.kitchenStatus]}
                  </span>
                </div>
                <em>{formatLira(line.lineTotal)}</em>
              </li>
            ))}
          </ul>
        )}
      </div>

      {detail ? (
        <div className="floor-order-footer">
          <div className="floor-detail-totals">
            <div>
              <span>Toplam</span>
              <strong>{formatLira(detail.total)}</strong>
            </div>
            <div>
              <span>Ödenen</span>
              <strong>{formatLira(detail.paid)}</strong>
            </div>
            <div>
              <span>Kalan</span>
              <strong>{formatLira(detail.remaining)}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
