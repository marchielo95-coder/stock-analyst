const RANGES = [
  { key: '1D', label: '1D',   desc: 'Hoy — datos cada 5 minutos' },
  { key: '5D', label: '5D',   desc: '5 días — datos cada 30 minutos' },
  { key: '1M', label: '1M',   desc: 'Último mes — datos diarios' },
  { key: '6M', label: '6M',   desc: 'Últimos 6 meses — datos diarios' },
  { key: '1Y', label: '1A',   desc: 'Último año — datos diarios' },
  { key: '5Y', label: '5A',   desc: 'Últimos 5 años — datos semanales' },
];

export default function TimeRangeSelector({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {RANGES.map(({ key, label, desc }) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            title={desc}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: isActive ? '1px solid rgba(59,130,246,0.5)' : '1px solid var(--border)',
              background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: isActive ? '#60a5fa' : 'var(--muted)',
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { if (!isActive) { e.target.style.background = 'var(--surface2)'; e.target.style.color = 'var(--text)'; }}}
            onMouseLeave={(e) => { if (!isActive) { e.target.style.background = 'transparent'; e.target.style.color = 'var(--muted)'; }}}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
