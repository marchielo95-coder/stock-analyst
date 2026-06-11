import { useEffect, useRef } from 'react';

const RANGE_MAP = {
  '1D': '1D',
  '5D': '5D',
  '1M': '1M',
  '6M': '6M',
  '1Y': '12M',
  '5Y': '60M',
};

const INTERVAL_MAP = {
  '1D': '5',
  '5D': '30',
  '1M': 'D',
  '6M': 'D',
  '1Y': 'W',
  '5Y': 'W',
};

export default function TradingViewChart({ ticker, range }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: ticker,
      interval: INTERVAL_MAP[range] || 'D',
      range: RANGE_MAP[range] || '12M',
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'es',
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
      backgroundColor: 'rgba(15, 22, 38, 1)',
      gridColor: 'rgba(30, 45, 69, 0.5)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
    });

    containerRef.current.appendChild(script);
    widgetRef.current = script;

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [ticker, range]);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: 520, width: '100%' }}
      />
    </div>
  );
}
