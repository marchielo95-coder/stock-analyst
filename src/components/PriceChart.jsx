import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
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
  if (!data?.length) return (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
      Sin datos disponibles
    </div>
  );

  const formatted = data.map(d => ({ ...d, dateLabel: formatDate(d.date, range) }));
  const prices = data.map(d => d.close).filter(Boolean);
  const minPrice = Math.min(...prices) * 0.975;
  const maxPrice = Math.max(...prices) * 1.025;

  // Reduce tick density for large datasets
  const tickCount = data.length > 200 ? 8 : data.length > 60 ? 10 : 12;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={formatted} margin={{ top: 6, right: 10, left: 6, bottom: 6 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false} axisLine={false}
          interval={Math.floor(data.length / tickCount)}
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
      </ComposedChart>
    </ResponsiveContainer>
  );
}
