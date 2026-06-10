export const fmt = (n, decimals = 2) =>
  n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const fmtPct = (n) => n == null ? '—' : `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
export const fmtUSD = (n) => n == null ? '—' : `$${fmt(n)}`;
export const fmtBig = (n) => {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return fmtUSD(n);
};

export const momentumLabel = {
  ALCISTA_FUERTE: { label: 'Alcista fuerte', color: '#22c55e' },
  ALCISTA:        { label: 'Alcista',         color: '#86efac' },
  NEUTRAL:        { label: 'Neutral',          color: '#94a3b8' },
  BAJISTA:        { label: 'Bajista',          color: '#fbbf24' },
  BAJISTA_FUERTE: { label: 'Bajista fuerte',  color: '#ef4444' },
};

export const alertColors = {
  danger:  { bg: 'bg-red-500/20',    border: 'border-red-500/40',    text: 'text-red-400',    icon: '🔴' },
  warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', icon: '⚠️' },
  success: { bg: 'bg-green-500/20',  border: 'border-green-500/40',  text: 'text-green-400',  icon: '🟡' },
  buy:     { bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   text: 'text-blue-400',   icon: '🟢' },
};
