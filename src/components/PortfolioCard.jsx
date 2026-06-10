import { fmtUSD, fmtPct, fmt } from '../lib/utils';

const ALERT_COLORS = {
  danger:  { bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)',   text: '#f87171', icon: '🔴' },
  warning: { bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)',  text: '#fbbf24', icon: '⚠️' },
  success: { bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)',   text: '#4ade80', icon: '🟡' },
  buy:     { bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)', text: '#60a5fa', icon: '🟢' },
};

export default function PortfolioCard({ position, onClick, isSelected, color }) {
  const { ticker, name, currentPrice, dailyChangePct, pnl, pnlPct, marketValue, indicators, alerts } = position;
  const isUp = dailyChangePct >= 0;
  const isPnlUp = pnl >= 0;
  const topAlert = alerts?.[0];
  const alertStyle = topAlert ? ALERT_COLORS[topAlert.type] : null;

  return (
    <div
      onClick={() => onClick(ticker)}
      style={{
        background: isSelected ? 'rgba(59,130,246,0.08)' : 'var(--surface)',
        border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* Row 1: ticker + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <span style={{
              fontWeight: 700, fontSize: 14, color: color,
              background: `${color}18`, padding: '1px 8px', borderRadius: 6,
              fontFamily: 'monospace',
            }}>
              {ticker}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{fmtUSD(currentPrice)}</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: isUp ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
            {isUp ? '▲' : '▼'} {Math.abs(dailyChangePct).toFixed(2)}% hoy
          </p>
        </div>
      </div>

      {/* Row 2: metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>Valor</p>
          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{fmtUSD(marketValue)}</p>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px' }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>G/P</p>
          <p style={{ fontWeight: 600, fontSize: 13, color: isPnlUp ? 'var(--green)' : 'var(--red)' }}>
            {isPnlUp ? '+' : ''}{fmtUSD(pnl)}
          </p>
          <p style={{ fontSize: 10, color: isPnlUp ? 'var(--green)' : 'var(--red)', opacity: 0.8 }}>
            {fmtPct(pnlPct)}
          </p>
        </div>
      </div>

      {/* Row 3: badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {indicators?.rsi != null && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: indicators.rsi < 35 ? 'rgba(34,197,94,0.15)' : indicators.rsi > 70 ? 'rgba(239,68,68,0.15)' : 'var(--surface2)',
            color: indicators.rsi < 35 ? 'var(--green)' : indicators.rsi > 70 ? 'var(--red)' : 'var(--muted2)',
          }}>
            RSI {fmt(indicators.rsi, 1)}
          </span>
        )}
        {indicators?.ma50 && currentPrice && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: currentPrice > indicators.ma50 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: currentPrice > indicators.ma50 ? 'var(--green)' : 'var(--red)',
          }}>
            {currentPrice > indicators.ma50 ? '↑' : '↓'} MA50
          </span>
        )}
        {indicators?.ma200 && currentPrice && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: currentPrice > indicators.ma200 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: currentPrice > indicators.ma200 ? 'var(--green)' : 'var(--red)',
          }}>
            {currentPrice > indicators.ma200 ? '↑' : '↓'} MA200
          </span>
        )}
      </div>

      {/* Alert */}
      {topAlert && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 12,
          background: alertStyle.bg,
          border: `1px solid ${alertStyle.border}`,
          color: alertStyle.text,
          lineHeight: 1.4,
        }}>
          {alertStyle.icon} {topAlert.message}
        </div>
      )}
    </div>
  );
}
