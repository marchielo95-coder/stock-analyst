import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

const SUGGESTIONS = ['NVDA', 'AMD', 'MSFT', 'URA', 'CCJ', 'XBI', 'FSLR', 'ASML', 'ARGT'];

export default function SearchBox({ onSearch, loading }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const t = value.trim().toUpperCase();
    if (t) { onSearch(t); setValue(''); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="Ticker (ej: NVDA, URA)..."
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '9px 12px 9px 34px',
              fontSize: 13,
              color: 'var(--text)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          style={{
            padding: '9px 16px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: (loading || !value.trim()) ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          {loading && <Loader2 size={13} className="animate-spin" />}
          Analizar
        </button>
      </form>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>Ideas:</span>
        {SUGGESTIONS.map((t) => (
          <button
            key={t}
            onClick={() => onSearch(t)}
            style={{
              fontSize: 11, fontWeight: 600,
              padding: '3px 9px', borderRadius: 20,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--muted2)',
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => { e.target.style.background = 'var(--border)'; e.target.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'var(--surface2)'; e.target.style.color = 'var(--muted2)'; }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
