import PriceChart from './PriceChart';
import IndicatorCharts from './IndicatorCharts';
import NewsFeed from './NewsFeed';
import TimeRangeSelector from './TimeRangeSelector';
import InfoTooltip from './InfoTooltip';
import { fmtUSD, fmtPct, fmt, fmtBig } from '../lib/utils';
import { Loader2 } from 'lucide-react';

const MOMENTUM_MAP = {
  ALCISTA_FUERTE: { label: 'Alcista fuerte', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  ALCISTA:        { label: 'Alcista',         color: '#86efac', bg: 'rgba(134,239,172,0.12)' },
  NEUTRAL:        { label: 'Neutral',          color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  BAJISTA:        { label: 'Bajista',          color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  BAJISTA_FUERTE: { label: 'Bajista fuerte',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const ALERT_COLORS = {
  danger:  { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  text: '#f87171', icon: '🔴' },
  warning: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', text: '#fbbf24', icon: '⚠️' },
  success: { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',  text: '#4ade80', icon: '🟡' },
  buy:     { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)', text: '#60a5fa', icon: '🟢' },
};

// ── Tooltips educativos ───────────────────────────────────────────────────────
const TIPS = {
  ma50:      'Media Móvil de 50 días: promedio del precio de las últimas 50 sesiones. Si el precio está sobre ella, la tendencia de corto/mediano plazo es alcista.',
  ma200:     'Media Móvil de 200 días: el indicador más respetado de tendencia a largo plazo. Precio sobre MA200 = tendencia principal alcista. "Golden Cross" (MA50 cruza MA200 hacia arriba) es señal muy alcista.',
  rsi:       'RSI (Índice de Fuerza Relativa, 14 días): mide cuánta presión compradora vs vendedora hay. Bajo 30 = sobrevendido, posible rebote. Sobre 70 = sobrecomprado, posible corrección.',
  macdHist:  'Histograma MACD: diferencia entre la línea MACD y su señal. Positivo = compradores dominan. Negativo = vendedores dominan. Un cambio de signo suele anticipar un cambio de tendencia.',
  support:   'Soporte: nivel de precio donde históricamente el activo ha rebotado al bajar. Si lo rompe hacia abajo, puede caer más fuerte.',
  resistance:'Resistencia: nivel de precio donde históricamente el activo ha frenado su subida. Si lo rompe hacia arriba, puede acelerar.',
  momentum:  'Momentum: resumen del estado del activo combinando RSI y MACD. No predice el futuro — describe la presión actual del mercado.',
  pnl:       'Ganancia o Pérdida no realizada: diferencia entre el valor actual de tu posición y lo que pagaste. Se hace efectiva solo cuando vendes.',
  marketCap: 'Capitalización de mercado: valor total de la empresa en bolsa (precio × acciones en circulación). Grande = más estable pero menos potencial de crecimiento.',
  pe:        'Precio/Ganancias (P/E): cuántas veces el mercado paga las ganancias anuales de la empresa. Alto puede ser expectativa de crecimiento o sobrevaloración.',
  week52:    'Rango de precio de los últimos 52 semanas. Útil para saber si el precio actual está cerca de máximos o mínimos históricos recientes.',
};

function SectionTitle({ children }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
      {children}
    </p>
  );
}

function Stat({ label, value, sub, color, labelColor, bg, tip }) {
  return (
    <div style={{ background: bg || 'var(--surface2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <p style={{ fontSize: 10, color: labelColor || 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        {tip && <InfoTooltip text={tip} />}
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, color: color || 'var(--text)' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: color || 'var(--muted)', marginTop: 3, opacity: 0.8 }}>{sub}</p>}
    </div>
  );
}

export default function AnalysisPanel({ data, news, ticker, position, range, onRangeChange, chartLoading, isLive, livePrice }) {
  if (!data) return null;

  const { indicators, support, resistance, momentum, chartData, rsiData, macdData, week52High, week52Low, marketCap, peRatio } = data;
  const alerts  = position?.alerts || [];
  const m       = MOMENTUM_MAP[momentum] || MOMENTUM_MAP.NEUTRAL;
  const rec     = buildRecommendation(data, position);
  const aboveMA50  = indicators.ma50  && data.currentPrice > indicators.ma50;
  const aboveMA200 = indicators.ma200 && data.currentPrice > indicators.ma200;
  const distSup = ((data.currentPrice - support) / data.currentPrice * 100);
  const distRes = ((resistance - data.currentPrice) / data.currentPrice * 100);
  const analysis = buildAnalysis(data, position);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── TICKER HEADER ───────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: 'var(--accent)', background: 'rgba(59,130,246,0.1)', padding: '2px 10px', borderRadius: 8 }}>
                {data.ticker}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{data.name}</span>
              {isLive && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.2)' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  LIVE
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 32, color: 'var(--text)' }}>{fmtUSD(data.currentPrice)}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: data.dailyChangePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {data.dailyChangePct >= 0 ? '▲' : '▼'} {Math.abs(data.dailyChangePct).toFixed(2)}% hoy
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: m.color, background: m.bg, border: `1px solid ${m.color}40` }}>
                {m.label}
              </span>
              <InfoTooltip text={TIPS.momentum} />
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center' }}>
          {week52High && week52Low && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>52 semanas</span>
              <span style={{ fontSize: 12, color: 'var(--muted2)', fontWeight: 500 }}>{fmtUSD(week52Low)} – {fmtUSD(week52High)}</span>
              <InfoTooltip text={TIPS.week52} />
            </div>
          )}
          {marketCap && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Mkt Cap</span>
              <span style={{ fontSize: 12, color: 'var(--muted2)', fontWeight: 500 }}>{fmtBig(marketCap)}</span>
              <InfoTooltip text={TIPS.marketCap} />
            </div>
          )}
          {peRatio && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>P/E</span>
              <span style={{ fontSize: 12, color: 'var(--muted2)', fontWeight: 500 }}>{fmt(peRatio, 1)}</span>
              <InfoTooltip text={TIPS.pe} />
            </div>
          )}
          {data.dayHigh && data.dayLow && (
            <div>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Hoy </span>
              <span style={{ fontSize: 12, color: 'var(--muted2)', fontWeight: 500 }}>
                {fmtUSD(data.dayLow)} – {fmtUSD(data.dayHigh)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── RECOMMENDATION ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: rec.bg, border: `1px solid ${rec.border}`, borderRadius: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: rec.color, flexShrink: 0 }}>{rec.emoji} {rec.action}</span>
        <span style={{ fontSize: 11, color: rec.color, opacity: 0.7, flexShrink: 0 }}>confianza {rec.confidence}</span>
        <span style={{ width: 1, height: 14, background: rec.border, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--muted)', flex: 1, minWidth: 0 }}>
          {[...rec.pros.slice(0,2).map(r=>`✓ ${r}`), ...rec.cons.slice(0,2).map(r=>`✗ ${r}`)].join(' · ')}
        </span>
      </div>

      {/* ── ALERTS ─────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((a, i) => {
            const s = ALERT_COLORS[a.type];
            return (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 16px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, color: s.text, fontSize: 13 }}>
                <span style={{ flexShrink: 0 }}>{s.icon}</span><span>{a.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── INDICATORS ─────────────────────────────────────────── */}
      <div>
        <SectionTitle>Indicadores técnicos</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <Stat label="MA50"  value={fmtUSD(indicators.ma50)}
            sub={aboveMA50 ? '↑ Sobre MA50' : '↓ Bajo MA50'}
            color={aboveMA50 ? 'var(--green)' : 'var(--red)'} labelColor="#f59e0b" tip={TIPS.ma50} />
          <Stat label="MA200" value={fmtUSD(indicators.ma200)}
            sub={aboveMA200 ? '↑ Tendencia LP alcista' : '↓ Tendencia LP bajista'}
            color={aboveMA200 ? 'var(--green)' : 'var(--red)'} labelColor="#a78bfa" tip={TIPS.ma200} />
          <Stat label="RSI (14)" value={indicators.rsi ? fmt(indicators.rsi, 1) : '—'}
            sub={indicators.rsi < 30 ? 'Sobrevendido' : indicators.rsi > 70 ? 'Sobrecomprado' : 'Zona neutral'}
            color={indicators.rsi < 35 ? 'var(--green)' : indicators.rsi > 70 ? 'var(--red)' : 'var(--muted2)'} tip={TIPS.rsi} />
          <Stat label="MACD Hist"
            value={indicators.macd ? (indicators.macd.histogram >= 0 ? '+' : '') + fmt(indicators.macd.histogram, 4) : '—'}
            sub={indicators.macd?.histogram >= 0 ? 'Presión compradora' : 'Presión vendedora'}
            color={indicators.macd?.histogram >= 0 ? 'var(--green)' : 'var(--red)'} tip={TIPS.macdHist} />
        </div>
      </div>

      {/* ── SUPPORT / RESISTANCE ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <p style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>🟢 Soporte (60d)</p>
            <InfoTooltip text={TIPS.support} />
          </div>
          <p style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>{fmtUSD(support)}</p>
          <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 4, opacity: 0.85 }}>{distSup.toFixed(1)}% bajo el precio actual</p>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <p style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>🔴 Resistencia (60d)</p>
            <InfoTooltip text={TIPS.resistance} />
          </div>
          <p style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>{fmtUSD(resistance)}</p>
          <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, opacity: 0.85 }}>{distRes.toFixed(1)}% sobre el precio actual</p>
        </div>
      </div>

      {/* ── MARKET READING ─────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <SectionTitle>📊 Lectura del mercado</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {analysis.map((line, i) => (
            <p key={i} style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.65 }}>{line}</p>
          ))}
        </div>
      </div>

      {/* ── PRICE CHART ────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SectionTitle style={{ margin: 0 }}>Precio + MA50/MA200</SectionTitle>
            <div style={{ display: 'flex', gap: 12 }}>
              {[['MA50', '#f59e0b'], ['MA200', '#a78bfa']].map(([label, color]) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                  <span style={{ width: 18, height: 2, background: color, display: 'inline-block', borderRadius: 2 }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <TimeRangeSelector selected={range} onChange={onRangeChange} />
        </div>
        {chartLoading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13 }}>Cargando datos…</span>
          </div>
        ) : (
          <PriceChart data={chartData} support={support} resistance={resistance} range={range} />
        )}
      </div>

      {/* ── RSI + MACD ─────────────────────────────────────────── */}
      <IndicatorCharts rsiData={rsiData} macdData={macdData} indicators={indicators} range={range} onRangeChange={onRangeChange} />

      {/* ── NEWS ───────────────────────────────────────────────── */}
      <NewsFeed news={news} ticker={ticker} />
    </div>
  );
}

// ── Buy / Sell / Hold recommendation ─────────────────────────────────────────
function buildRecommendation(data, position) {
  const { indicators, currentPrice } = data;
  const { rsi, macd, ma50, ma200 } = indicators;

  let score = 0;
  const pros = []; // bullish reasons
  const cons = []; // bearish reasons

  // MA200 — long-term trend, weight 3
  if (ma200) {
    if (currentPrice > ma200) { score += 3; pros.push(`Precio sobre MA200 (${fmtUSD(ma200)}) — tendencia LP alcista`); }
    else                       { score -= 3; cons.push(`Precio bajo MA200 (${fmtUSD(ma200)}) — tendencia LP bajista`); }
  }

  // MA50 — mid-term trend, weight 1
  if (ma50) {
    if (currentPrice > ma50) { score += 1; pros.push(`Sobre MA50 (${fmtUSD(ma50)}) — tendencia mediano plazo positiva`); }
    else                      { score -= 1; cons.push(`Bajo MA50 (${fmtUSD(ma50)}) — debilidad de mediano plazo`); }
  }

  // RSI, weight 2
  if (rsi != null) {
    if (rsi < 30)       { score += 2; pros.push(`RSI sobrevendido (${rsi.toFixed(1)}) — posible zona de rebote`); }
    else if (rsi < 42)  { score += 1; pros.push(`RSI bajo (${rsi.toFixed(1)}) — sin sobrecompra`); }
    else if (rsi > 75)  { score -= 2; cons.push(`RSI sobrecomprado (${rsi.toFixed(1)}) — riesgo de corrección`); }
    else if (rsi > 65)  { score -= 1; cons.push(`RSI elevado (${rsi.toFixed(1)}) — precaución en nuevas entradas`); }
  }

  // MACD histogram, weight 1
  if (macd) {
    if (macd.histogram > 0) { score += 1; pros.push(`MACD positivo — momentum comprador`); }
    else                     { score -= 1; cons.push(`MACD negativo — momentum vendedor`); }
  }

  // Position P&L rules
  if (position) {
    const pct = (currentPrice - position.entryPrice) / position.entryPrice;
    if (pct >= 0.15)  { score -= 1; cons.push(`+${(pct*100).toFixed(1)}% sobre precio de entrada — zona de toma de ganancias`); }
    if (pct <= -0.07) { score -= 2; cons.push(`${(pct*100).toFixed(1)}% bajo precio de entrada — stop loss alcanzado`); }
    if (pct >= 0.30)  { score -= 1; cons.push(`+${(pct*100).toFixed(1)}% — posición muy rentable, considerar reducir exposición`); }
  }

  let action, emoji, color, bg, border;
  if (score >= 4)       { action = 'COMPRAR';  emoji = '🟢'; color = '#4ade80'; bg = 'rgba(34,197,94,0.08)';  border = 'rgba(34,197,94,0.25)'; }
  else if (score <= -2) { action = 'VENDER';   emoji = '🔴'; color = '#f87171'; bg = 'rgba(239,68,68,0.08)';  border = 'rgba(239,68,68,0.25)'; }
  else                  { action = 'MANTENER'; emoji = '🟡'; color = '#fbbf24'; bg = 'rgba(245,158,11,0.08)'; border = 'rgba(245,158,11,0.25)'; }

  const absScore = Math.abs(score);
  const confidence = absScore >= 5 ? 'alta' : absScore >= 3 ? 'media' : 'baja';

  return { action, emoji, color, bg, border, confidence, pros, cons, score };
}

// ── Analysis text builder ─────────────────────────────────────────────────────
function buildAnalysis(data, position) {
  const lines = [];
  const { indicators, momentum, currentPrice, ticker, support, resistance } = data;
  const MOMENTUM_TEXT = {
    ALCISTA_FUERTE: 'alcista fuerte — RSI en zona de impulso y MACD positivo confirman presión compradora dominante.',
    ALCISTA:        'alcista — MACD con histograma positivo indica que los compradores llevan ventaja.',
    NEUTRAL:        'neutral — sin señal clara de dirección; esperar confirmación antes de actuar.',
    BAJISTA:        'bajista — MACD negativo indica que la presión vendedora supera a la compradora.',
    BAJISTA_FUERTE: 'bajista fuerte — RSI elevado y MACD negativo confirman presión vendedora dominante.',
  };
  lines.push(`Momentum de ${ticker}: ${MOMENTUM_TEXT[momentum] || 'neutral.'}`);

  const aboveMA50  = indicators.ma50  && currentPrice > indicators.ma50;
  const aboveMA200 = indicators.ma200 && currentPrice > indicators.ma200;
  if (aboveMA50 && aboveMA200)
    lines.push(`El precio cotiza sobre MA50 (${fmtUSD(indicators.ma50)}) y MA200 (${fmtUSD(indicators.ma200)}): estructura técnica de largo plazo intacta. Mientras se mantenga sobre MA200, la tendencia principal es alcista.`);
  else if (!aboveMA50 && aboveMA200)
    lines.push(`El precio rompió la MA50 (${fmtUSD(indicators.ma50)}) pero mantiene MA200 (${fmtUSD(indicators.ma200)}). Corrección de mediano plazo en curso — recuperar la MA50 es la clave para confirmar continuidad.`);
  else if (!aboveMA200)
    lines.push(`⚠️ El precio está bajo la MA200 (${fmtUSD(indicators.ma200)}): señal bajista estructural. La tendencia de largo plazo está en contra — operar con precaución.`);

  if (indicators.rsi != null) {
    if (indicators.rsi < 30)
      lines.push(`RSI en ${indicators.rsi.toFixed(1)}: sobreventa extrema. Posible rebote técnico inminente, pero no garantiza el suelo definitivo.`);
    else if (indicators.rsi < 40 && aboveMA200)
      lines.push(`RSI en ${indicators.rsi.toFixed(1)} con precio sobre MA200: zona históricamente favorable para acumulación táctica de mediano plazo.`);
    else if (indicators.rsi > 75)
      lines.push(`RSI en ${indicators.rsi.toFixed(1)}: sobrecompra. Riesgo de corrección a corto plazo — evitar compras nuevas sin un pullback previo.`);
  }

  const rr = ((resistance - currentPrice) / currentPrice * 100 / ((currentPrice - support) / currentPrice * 100)).toFixed(1);
  lines.push(`Relación riesgo/beneficio: 1:${rr} — soporte en ${fmtUSD(support)} (${((currentPrice - support) / currentPrice * 100).toFixed(1)}% abajo) · resistencia en ${fmtUSD(resistance)} (${((resistance - currentPrice) / currentPrice * 100).toFixed(1)}% arriba).`);

  if (position) {
    const pct = ((currentPrice - position.entryPrice) / position.entryPrice * 100);
    lines.push(`Tu posición: entrada a ${fmtUSD(position.entryPrice)}, precio actual ${fmtUSD(currentPrice)} → ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}% no realizado. Stop loss referencial en ${fmtUSD(position.entryPrice * 0.93)}.`);
  }
  return lines;
}
