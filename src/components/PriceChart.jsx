import { useState, useCallback } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Brush,
} from 'recharts';
import { fmtUSD, fmt } from '../lib/utils';

function formatDate(dateVal, range) {
  try {
    const d = new Date(dateVal);
    if (range === '1D') return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    if (range === '5D') return d.toLocaleDateString('es-CL', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    if (range === '5Y') return d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  } catch { return String(dateVal); }
}

const CustomTooltip = ({ active, payload, label, range }) => {
  if (!active || !payload?.length) return null;
  let dateStr;
  try {
    const d = new Date(label);
    dateStr = range === '1D' || range === '5D'
      ? d.toLocaleString('es-CL', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
  } catch { dateStr = label; }

  return (
    <div style={{ background: '#0f1626', border: '1px solid #1e2d45', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#64748b', marginBottom: 6, fontSize: 11 }}>{dateStr}</p>
      {payload.map(p => p.value != null && (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 500, marginBottom: 2 }}>
          {p.name}: {p.dataKey === 'volume' ? fmt(p.value / 1e6, 2) + 'M' : fmtUSD(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function PriceChart({ data, support, resistance, range = '1Y' }) {
  const [zoomState, setZoomState] = useState({ left: 'dataMin', right: 'dataMax', refLeft: null, refRight: null, selecting: false });

  if (!data?.length) return (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
      Sin datos disponibles
    </div>
  );

  const formatted = data.map((d, i) => ({ ...d, idx: i, dateLabel: formatDate(d.date, range) }));

  const visibleData = (zoomState.left === 'dataMin' && zoomState.right === 'dataMax')
    ? formatted
    : formatted.slice(zoomState.left, zoomState.right + 1);

  const prices = visibleData.map(d => d.close).filter(Boolean);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;

  const tickCount = visibleData.length > 200 ? 8 : visibleData.length > 60 ? 10 : 12;
  const isZoomed = zoomState.left !== 'dataMin' || zoomState.right !== 'dataMax';

  const handleMouseDown = useCallback((e) => {
    if (!e?.activeLabel) return;
    const idx = formatted.findIndex(d => d.dateLabel === e.activeLabel);
    setZoomState(z => ({ ...z, refLeft: idx, refRight: null, selecting: true }));
  }, [formatted]);

  const handleMouseMove = useCallback((e) => {
    if (!zoomState.selecting || !e?.activeLabel) return;
    const idx = formatted.findIndex(d => d.dateLabel === e.activeLabel);
    setZoomState(z => ({ ...z, refRight: idx }));
  }, [zoomState.selecting, formatted]);

  const handleMouseUp = useCallback(() => {
    if (!zoomState.selecting) return;
    const { refLeft, refRight } = zoomState;
    if (refLeft === null || refRight === null || refLeft === refRight) {
      setZoomState(z => ({ ...z, selecting: false, refLeft: null, refRight: null }));
      return;
    }
    const [l, r] = [Math.min(refLeft, refRight), Math.max(refLeft, refRight)];
    setZoomState({ left: l, right: r, refLeft: null, refRight: null, selecting: false });
  }, [zoomState]);

  const resetZoom = () => setZoomState({ left: 'dataMin', right: 'dataMax', refLeft: null, refRight: null, selecting: false });

  return (
    <div style={{ position: 'relative' }}>
      {isZoomed && (
        <button
          onClick={resetZoom}
          style={{
            position: 'absolute', top: 6, right: 14, zIndex: 10,
            background: '#1e2d45', border: '1px solid #2d3f5a', borderRadius: 6,
            color: '#94a3b8', fontSize: 11, padding: '3px 8px', cursor: 'pointer',
          }}
        >
          Reset zoom
        </button>
      )}
      {!isZoomed && (
        <p style={{ position: 'absolute', top: 6, right: 14, zIndex: 10, fontSize: 10, color: '#475569', margin: 0 }}>
          Arrastra para hacer zoom
        </p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={visibleData}
          margin={{ top: 6, right: 10, left: 6, bottom: 6 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false} axisLine={false}
            interval={Math.floor(visibleData.length / tickCount)}
          />
          <YAxis
            yAxisId="price" domain={[minPrice, maxPrice]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false} axisLine={false}
            tickFormatter={v => `$${fmt(v, 0)}`} width={60}
          />
          <YAxis yAxisId="vol" orientation="right" hide />
          <Tooltip content={<CustomTooltip range={range} />} />

          {support > 0 && (
            <ReferenceLine yAxisId="price" y={support} stroke="#22c55e" strokeDasharray="5 3" strokeWidth={1}
              label={{ value: `Sop $${fmt(support, 0)}`, fill: '#22c55e', fontSize: 10, position: 'insideBottomLeft' }} />
          )}
          {resistance > 0 && (
            <ReferenceLine yAxisId="price" y={resistance} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1}
              label={{ value: `Res $${fmt(resistance, 0)}`, fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
          )}

          <Bar yAxisId="vol" dataKey="volume" name="Volumen" fill="#1e2d45" opacity={0.8} radius={[1, 1, 0, 0]} />
          <Line yAxisId="price" type="monotone" dataKey="close"  name="Precio" stroke="#3b82f6" strokeWidth={2}   dot={false} />
          <Line yAxisId="price" type="monotone" dataKey="ma50"   name="MA50"   stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="5 3" connectNulls />
          <Line yAxisId="price" type="monotone" dataKey="ma200"  name="MA200"  stroke="#a78bfa" strokeWidth={1.5} dot={false} strokeDasharray="5 3" connectNulls />

          {zoomState.selecting && zoomState.refLeft !== null && zoomState.refRight !== null && (
            <ReferenceArea
              yAxisId="price"
              x1={formatted[Math.min(zoomState.refLeft, zoomState.refRight)]?.dateLabel}
              x2={formatted[Math.max(zoomState.refLeft, zoomState.refRight)]?.dateLabel}
              fill="#3b82f6" fillOpacity={0.15}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
