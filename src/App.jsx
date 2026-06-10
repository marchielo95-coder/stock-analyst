import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, TrendingUp, Loader2, AlertCircle, BarChart2, Settings } from 'lucide-react';
import PortfolioCard from './components/PortfolioCard';
import PortfolioManager, { loadPositions, savePositions } from './components/PortfolioManager';
import AnalysisPanel from './components/AnalysisPanel';
import SearchBox from './components/SearchBox';
import { getPortfolio, getAnalysis, getNews, getLivePrice } from './lib/api';
import { fmtUSD } from './lib/utils';
import './index.css';

const TICKER_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a78bfa', '#f87171', '#34d399', '#60a5fa', '#fb923c'];
const tickerColor = (ticker, positions) => {
  const idx = positions.findIndex(p => p.ticker === ticker);
  return TICKER_COLORS[idx % TICKER_COLORS.length] || '#64748b';
};

const REFRESH_MS = 30000;

export default function App() {
  // ── Portfolio state from localStorage ──────────────────────────────────────
  const [positions,        setPositions]        = useState(() => loadPositions());
  const [portfolio,        setPortfolio]        = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError,   setPortfolioError]   = useState(null);
  const [lastUpdated,      setLastUpdated]      = useState(null);
  const [showManager,      setShowManager]      = useState(false);

  // ── Analysis state ─────────────────────────────────────────────────────────
  const [selectedTicker,  setSelectedTicker]  = useState(null);
  const [analysis,        setAnalysis]        = useState(null);
  const [livePrice,       setLivePrice]       = useState(null);
  const [news,            setNews]            = useState(null);
  const [range,           setRange]           = useState('1D');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [chartLoading,    setChartLoading]    = useState(false);
  const [analysisError,   setAnalysisError]   = useState(null);
  const [isLive,          setIsLive]          = useState(false);

  const [clock, setClock] = useState(new Date());
  const liveInterval      = useRef(null);
  const portfolioInterval = useRef(null);

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Portfolio load ─────────────────────────────────────────────────────────
  const loadPortfolio = useCallback(async (silent = false, posOverride) => {
    const pos = posOverride ?? positions;
    if (!silent) setPortfolioLoading(true);
    setPortfolioError(null);
    try {
      const data = await getPortfolio(pos);
      setPortfolio(data);
      setLastUpdated(new Date());
    } catch (e) {
      setPortfolioError(e.response?.data?.error || e.message);
    } finally {
      setPortfolioLoading(false);
    }
  }, [positions]);

  // Reload portfolio when positions change
  useEffect(() => {
    savePositions(positions);
    loadPortfolio(false, positions);
    clearInterval(portfolioInterval.current);
    portfolioInterval.current = setInterval(() => loadPortfolio(true, positions), REFRESH_MS);
    return () => clearInterval(portfolioInterval.current);
  }, [positions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePositionsChange = useCallback((next) => {
    setPositions(next);
    // If selected ticker was removed, deselect it
    if (selectedTicker && !next.find(p => p.ticker === selectedTicker)) {
      setSelectedTicker(null);
      setAnalysis(null);
      setNews(null);
    }
  }, [selectedTicker]);

  // ── Live price polling ─────────────────────────────────────────────────────
  const pollLivePrice = useCallback(async (ticker) => {
    try {
      const data = await getLivePrice(ticker);
      setLivePrice(data);
      setIsLive(true);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    clearInterval(liveInterval.current);
    if (!selectedTicker) { setLivePrice(null); setIsLive(false); return; }
    pollLivePrice(selectedTicker);
    liveInterval.current = setInterval(() => pollLivePrice(selectedTicker), REFRESH_MS);
    return () => clearInterval(liveInterval.current);
  }, [selectedTicker, pollLivePrice]);

  // ── Analysis load ──────────────────────────────────────────────────────────
  const loadAnalysis = useCallback(async (ticker, selectedRange, isRangeChange = false) => {
    setSelectedTicker(ticker);
    if (isRangeChange) {
      setChartLoading(true);
    } else {
      setAnalysisLoading(true);
      setAnalysisError(null);
      setAnalysis(null);
      setNews(null);
      setLivePrice(null);
    }
    try {
      const fetchPromises = [getAnalysis(ticker, selectedRange)];
      if (!isRangeChange) fetchPromises.push(getNews(ticker));
      const results = await Promise.all(fetchPromises);
      setAnalysis(results[0]);
      if (!isRangeChange && results[1]) setNews(results[1]);
    } catch (e) {
      setAnalysisError(e.response?.data?.error || `No se pudo analizar ${ticker}`);
    } finally {
      setAnalysisLoading(false);
      setChartLoading(false);
    }
  }, []);

  const handleRangeChange = useCallback((newRange) => {
    setRange(newRange);
    if (selectedTicker) loadAnalysis(selectedTicker, newRange, true);
  }, [selectedTicker, loadAnalysis]);

  const handleTickerSelect = useCallback((ticker) => {
    setRange('1D');
    loadAnalysis(ticker, '1D', false);
  }, [loadAnalysis]);

  const selectedPosition = portfolio?.positions?.find(p => p.ticker === selectedTicker);
  const totalPnl   = portfolio?.totalPnl ?? 0;
  const totalValue = portfolio?.totalValue ?? 0;
  const totalCost  = portfolio?.totalCost ?? 0;
  const totalPct   = totalCost ? (totalPnl / totalCost * 100) : 0;

  const displayAnalysis = analysis && livePrice
    ? { ...analysis, currentPrice: livePrice.price, dailyChange: livePrice.change, dailyChangePct: livePrice.changePct }
    : analysis;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart2 size={18} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: 'var(--text)' }}>STOCK ANALYST</span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>· análisis personal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {portfolio && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>Cartera</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{fmtUSD(totalValue)}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {totalPnl >= 0 ? '+' : ''}{fmtUSD(totalPnl)}
                <span style={{ fontSize: 11, marginLeft: 3, opacity: 0.8 }}>({totalPct >= 0 ? '+' : ''}{totalPct.toFixed(2)}%)</span>
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLive && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22c55e' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                LIVE
              </span>
            )}
            <span style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'monospace' }}>
              {clock.toLocaleTimeString('es-CL')}
            </span>
            <button onClick={() => loadPortfolio()} disabled={portfolioLoading}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, borderRadius: 6, opacity: portfolioLoading ? 0.5 : 1 }}
              title="Actualizar ahora">
              <RefreshCw size={14} className={portfolioLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Portfolio section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p className="section-label" style={{ margin: 0 }}>Cartera actual</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {lastUpdated && (
                  <span style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.6 }}>
                    ↻ {lastUpdated.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={() => setShowManager(m => !m)}
                  title="Gestionar cartera"
                  style={{ background: showManager ? 'rgba(59,130,246,0.15)' : 'none', border: showManager ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent', cursor: 'pointer', color: showManager ? 'var(--accent)' : 'var(--muted)', padding: '3px 5px', borderRadius: 6 }}>
                  <Settings size={13} />
                </button>
              </div>
            </div>

            {/* Manager (collapsed/expanded) */}
            {showManager && (
              <div style={{ marginBottom: 14 }}>
                <PortfolioManager positions={positions} onChange={handlePositionsChange} />
              </div>
            )}

            {portfolioLoading && !portfolio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '32px 0', justifyContent: 'center', color: 'var(--muted)' }}>
                <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>Cargando precios...</span>
              </div>
            )}
            {portfolioError && (
              <div style={{ display: 'flex', gap: 10, padding: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#fca5a5' }}>
                <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
                <div><p style={{ fontWeight: 600, fontSize: 13 }}>Error al cargar</p><p style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>{portfolioError}</p></div>
              </div>
            )}
            {portfolio && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {portfolio.positions.map(pos => (
                  <PortfolioCard
                    key={pos.ticker} position={pos}
                    onClick={handleTickerSelect}
                    isSelected={selectedTicker === pos.ticker}
                    color={tickerColor(pos.ticker, positions)}
                  />
                ))}
                {/* Summary bar */}
                <div className="card" style={{ padding: '16px 18px', marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Valor total</p>
                      <p style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>{fmtUSD(totalValue)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>G/P no realizada</p>
                      <p style={{ fontWeight: 700, fontSize: 20, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {totalPnl >= 0 ? '+' : ''}{fmtUSD(totalPnl)}
                      </p>
                      <p style={{ fontSize: 11, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)', opacity: 0.8 }}>{totalPct >= 0 ? '+' : ''}{totalPct.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, overflow: 'hidden', background: 'var(--border)', display: 'flex', marginBottom: 10 }}>
                    {portfolio.positions.map(pos => (
                      <div key={pos.ticker} style={{ height: '100%', width: `${(pos.marketValue / totalValue * 100).toFixed(1)}%`, background: tickerColor(pos.ticker, positions) }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {portfolio.positions.map(pos => (
                      <span key={pos.ticker} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: tickerColor(pos.ticker, positions), display: 'inline-block' }} />
                        {pos.ticker} {(pos.marketValue / totalValue * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Search */}
          <section>
            <p className="section-label">Buscar oportunidad</p>
            <SearchBox onSearch={handleTickerSelect} loading={analysisLoading} />
          </section>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedTicker && !analysisLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12, color: 'var(--muted)', opacity: 0.5 }}>
              <TrendingUp size={48} strokeWidth={1} />
              <p style={{ fontSize: 14 }}>Selecciona un activo de tu cartera o busca un ticker</p>
            </div>
          )}
          {analysisLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12, color: 'var(--muted)' }}>
              <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>Analizando {selectedTicker}…</p>
              <p style={{ fontSize: 12, opacity: 0.6 }}>Calculando MA50/200 · RSI · MACD · buscando noticias</p>
            </div>
          )}
          {analysisError && !analysisLoading && (
            <div style={{ display: 'flex', gap: 12, padding: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#fca5a5' }}>
              <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
              <div><p style={{ fontWeight: 600 }}>Error: {selectedTicker}</p><p style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{analysisError}</p></div>
            </div>
          )}
          {displayAnalysis && !analysisLoading && (
            <AnalysisPanel
              data={displayAnalysis}
              news={news}
              ticker={selectedTicker}
              position={selectedPosition}
              range={range}
              onRangeChange={handleRangeChange}
              chartLoading={chartLoading}
              isLive={isLive}
              livePrice={livePrice}
            />
          )}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.5 }}>
          Precios actualizados cada 30s · Histórico con delay ~15min · Solo análisis, no asesoría financiera
        </p>
      </footer>
    </div>
  );
}
