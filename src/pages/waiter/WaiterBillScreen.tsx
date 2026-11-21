import { useEffect, useState } from 'react';
import * as paymentsApi from '@/api/paymentsApi';
import * as sessionsApi from '@/api/sessionsApi';
import type { PaymentMethod, TableSessionDetailResponse } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';

type WaiterBillScreenProps = {
  branchId: string;
  tableName: string;
  sessionId: string;
  onClose: () => void;
  onPaid: () => void;
};

function formatLira(value: number): string {
  return `${new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} ₺`;
}

export function WaiterBillScreen({
  branchId,
  tableName,
  sessionId,
  onClose,
  onPaid,
}: WaiterBillScreenProps) {
  const { getAccessToken } = useAuth();
  const [detail, setDetail] = useState<TableSessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [amountInput, setAmountInput] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadDetail() {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const next = await sessionsApi.getTableSession(token, branchId, sessionId);
      setDetail(next);
      setAmountInput('');
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : 'Hesap yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

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
          setError(err instanceof Error ? err.message : 'Hesap yüklenemedi');
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

  async function handlePay() {
    if (!detail || paying || detail.remaining <= 0) {
      return;
    }

    const trimmed = amountInput.trim().replace(',', '.');
    let amount: number | undefined;
    if (trimmed) {
      amount = Number(trimmed);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Geçerli bir tutar gir.');
        return;
      }
      if (amount > detail.remaining) {
        setError('Tutar kalan bakiyeyi aşamaz.');
        return;
      }
    }

    setPaying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await getAccessToken();
      const result = await paymentsApi.takePayment(token, branchId, sessionId, {
        method,
        amount: amount ?? null,
      });

      if (result.sessionClosed) {
        setSuccessMessage('Hesap kapatıldı.');
        onPaid();
        return;
      }

      setSuccessMessage(`${formatLira(result.amount)} alındı.`);
      await loadDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme alınamadı');
    } finally {
      setPaying(false);
    }
  }

  const canPay = Boolean(detail && detail.status === 'Open' && detail.remaining > 0);

  return (
    <section className="floor-order" aria-label={`${tableName} hesap`}>
      <div className="floor-order-bar">
        <button className="floor-text-btn" type="button" onClick={onClose} disabled={paying}>
          Geri
        </button>
        <div className="floor-order-title">
          <h2>{tableName}</h2>
          <p>Hesap</p>
        </div>
        <span className="floor-order-session" title={sessionId}>
          {detail?.status === 'Open' ? 'Oturum açık' : detail?.status ?? 'Oturum'}
        </span>
      </div>

      <div className="floor-order-scroll">
        {error ? <p className="floor-error">{error}</p> : null}
        {successMessage ? <p className="floor-bill-success">{successMessage}</p> : null}
        {loading ? (
          <p className="floor-empty">Hesap yükleniyor...</p>
        ) : !detail ? (
          <p className="floor-empty">Oturum bulunamadı.</p>
        ) : (
          <div className="floor-bill">
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

            {detail.lines.length === 0 ? (
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
                    </div>
                    <em>{formatLira(line.lineTotal)}</em>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {detail && detail.status === 'Open' ? (
        <div className="floor-order-footer">
          <div className="floor-bill-methods" role="group" aria-label="Ödeme yöntemi">
            <button
              className={`floor-bill-method${method === 'Cash' ? ' is-active' : ''}`}
              type="button"
              disabled={paying || !canPay}
              onClick={() => setMethod('Cash')}
            >
              Nakit
            </button>
            <button
              className={`floor-bill-method${method === 'Card' ? ' is-active' : ''}`}
              type="button"
              disabled={paying || !canPay}
              onClick={() => setMethod('Card')}
            >
              Kart
            </button>
          </div>

          <label className="floor-bill-amount">
            <span>Tutar (boş = kalanın tamamı)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder={detail.remaining > 0 ? String(detail.remaining) : '0'}
              value={amountInput}
              disabled={paying || !canPay}
              onChange={(event) => setAmountInput(event.target.value)}
            />
          </label>

          <button
            className="floor-order-submit"
            type="button"
            disabled={!canPay || paying}
            onClick={() => void handlePay()}
          >
            {paying
              ? 'Alınıyor...'
              : canPay
                ? `Ödeme al · ${formatLira(detail.remaining)}`
                : 'Ödenecek tutar yok'}
          </button>
        </div>
      ) : null}
    </section>
  );
}
