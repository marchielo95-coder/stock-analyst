import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Bar, ComposedChart,
} from 'recharts';
import { fmt } from '../lib/utils';
import InfoTooltip from './InfoTooltip';
import TimeRangeSelector from './TimeRangeSelector';

const TOOLTIPSTYLE = { background: '#0f1626', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12, padding: '8px 12px' };

const TIPS = {
  rsi:  'RSI bajo 30 = posible rebote (sobrevendido). RSI sobre 70 = posible corrección (sobrecomprado). La línea verde es zona de compra, la roja de venta.',
  macd: 'Las barras (histograma) muestran fuerza del momentum. Cuando la línea azul (MACD) cruza la roja (Signal) hacia arriba, es señal de posible entrada.',
};

export default function IndicatorCharts({ rsiData, macdData, indicators, range, onRangeChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* RSI */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>RSI (14)</p>
              <InfoTooltip text={TIPS.rsi} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 500, lineHeight: 1.4 }}>
              Mide si el activo tiene más presión compradora o vendedora. Bajo 30 → posible rebote. Sobre 70 → posible corrección.
            </p>
          </div>
          {indicators?.rsi != null && (
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 22, color: indicators.rsi < 35 ? 'var(--green)' : indicators.rsi > 70 ? 'var(--red)' : 'var(--muted2)' }}>
                {fmt(indicators.rsi, 1)}
              </span>
              <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                {indicators.rsi < 30 ? '⬇ Sobrevendido' : indicators.rsi > 70 ? '⬆ Sobrecomprado' : '↔ Neutral'}
              </p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 8 }}>
          <TimeRangeSelector selected={range} onChange={onRangeChange} />
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 20, height: 1, background: '#ef4444', display: 'inline-block' }} /> 70 sobrecompra
            </span>
            <span style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 20, height: 1, background: '#22c55e', display: 'inline-block' }} /> 30 sobreventa
            </span>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={rsiData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
              <XAxis hide />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={26} ticks={[0, 30, 50, 70, 100]} />
              <Tooltip formatter={v => [fmt(v, 1), 'RSI']} contentStyle={TOOLTIPSTYLE} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 2" strokeWidth={1} />
              <Line type="monotone" dataKey="rsi" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MACD */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>MACD (12·26·9)</p>
              <InfoTooltip text={TIPS.macd} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 500, lineHeight: 1.4 }}>
              Compara dos medias móviles para detectar cambios de momentum. Barras positivas = compradores dominan. Negativas = vendedores dominan.
            </p>
          </div>
          {indicators?.macd && (
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: indicators.macd.histogram >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {indicators.macd.histogram >= 0 ? '+' : ''}{fmt(indicators.macd.histogram, 4)}
              </span>
              <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>histograma</p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 8 }}>
          <TimeRangeSelector selected={range} onChange={onRangeChange} />
        </div>

        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
            {[['MACD', '#60a5fa'], ['Signal', '#f87171'], ['Histograma', '#818cf8']].map(([label, color]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                <span style={{ width: 14, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
                {label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <ComposedChart data={macdData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
              <XAxis hide />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} width={44} tickFormatter={v => fmt(v, 2)} />
              <Tooltip formatter={(v, n) => [fmt(v, 4), n]} contentStyle={TOOLTIPSTYLE} />
              <ReferenceLine y={0} stroke="#334155" />
              <Bar dataKey="histogram" name="Histograma" fill="#818cf8" opacity={0.65} />
              <Line type="monotone" dataKey="macd"   name="MACD"   stroke="#60a5fa" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="signal" name="Signal" stroke="#f87171" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
