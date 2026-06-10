import { useState } from 'react';
import { Plus, X, Edit2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { getQuote } from '../lib/api';
import { fmtUSD } from '../lib/utils';

const DEFAULT_POSITIONS = [
  { ticker: 'VOO',  shares: 6.596038958,  entryPrice: 695.24, name: 'Vanguard S&P 500 ETF' },
  { ticker: 'AAPL', shares: 5.444941544,  entryPrice: 308.04, name: 'Apple Inc.' },
  { ticker: 'TSM',  shares: 2.255249092,  entryPrice: 443.41, name: 'Taiwan Semiconductor' },
];

const STORAGE_KEY = 'stock_analyst_portfolio';

export function loadPositions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_POSITIONS;
}

export function savePositions(positions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); } catch {}
}

// ── Input helper ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 6,
          padding: '7px 10px', color: 'var(--text)', fontSize: 13, width: '100%',
          outline: 'none', boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border2)'}
      />
    </div>
  );
}

// ── Edit row for existing position ────────────────────────────────────────────
function EditRow({ pos, onSave, onCancel }) {
  const [shares,     setShares]     = useState(String(pos.shares));
  const [entryPrice, setEntryPrice] = useState(String(pos.entryPrice));

  const handleSave = () => {
    const s = parseFloat(shares);
    const e = parseFloat(entryPrice);
    if (!s || !e || s <= 0 || e <= 0) return;
    onSave({ ...pos, shares: s, entryPrice: e });
  };

  return (
    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>{pos.ticker}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Acciones" value={shares} onChange={setShares} type="number" placeholder="0.00" />
        <Field label="Precio entrada $" value={entryPrice} onChange={setEntryPrice} type="number" placeholder="0.00" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 7, color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Check size={13} /> Guardar
        </button>
        <button onClick={onCancel} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Add position form ─────────────────────────────────────────────────────────
function AddForm({ existingTickers, onAdd, onClose }) {
  const [ticker,     setTicker]     = useState('');
  const [shares,     setShares]     = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [preview,    setPreview]    = useState(null);

  const handleTickerBlur = async () => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    if (existingTickers.includes(t)) { setError('Ese ticker ya está en tu cartera'); return; }
    setLoading(true); setError(''); setPreview(null);
    try {
      const q = await getQuote(t);
      setPreview(q);
      setTicker(t);
    } catch { setError('Ticker no encontrado'); }
    finally { setLoading(false); }
  };

  const handleAdd = () => {
    const t = ticker.trim().toUpperCase();
    const s = parseFloat(shares);
    const e = parseFloat(entryPrice);
    if (!t || !s || !e || s <= 0 || e <= 0) { setError('Completa todos los campos correctamente'); return; }
    if (existingTickers.includes(t)) { setError('Ese ticker ya está en tu cartera'); return; }
    onAdd({ ticker: t, shares: s, entryPrice: e, name: preview?.name || t });
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>➕ Nueva acción</p>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2 }}><X size={14} /></button>
      </div>

      <div>
        <Field label="Ticker" value={ticker} onChange={v => { setTicker(v.toUpperCase()); setPreview(null); setError(''); }} placeholder="MSFT, NVDA…" />
        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 11, color: 'var(--muted)' }}><Loader2 size={11} className="animate-spin" /> Buscando…</div>}
        {preview && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted2)' }}>{preview.name} · {fmtUSD(preview.price)}</div>}
        {!loading && ticker.length > 0 && !preview && (
          <button onClick={handleTickerBlur} style={{ marginTop: 6, fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
            Verificar ticker
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Acciones" value={shares} onChange={setShares} type="number" placeholder="0.00" />
        <Field label="Precio entrada $" value={entryPrice} onChange={setEntryPrice} type="number" placeholder="0.00" />
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.08)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}

      <button onClick={handleAdd} style={{ padding: '9px 0', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: '#60a5fa', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        Agregar a cartera
      </button>
    </div>
  );
}

// ── Main PortfolioManager ─────────────────────────────────────────────────────
export default function PortfolioManager({ positions, onChange }) {
  const [editingTicker, setEditingTicker] = useState(null);
  const [showAdd,       setShowAdd]       = useState(false);

  const handleSave = (updated) => {
    const next = positions.map(p => p.ticker === updated.ticker ? updated : p);
    onChange(next);
    setEditingTicker(null);
  };

  const handleRemove = (ticker) => {
    if (!confirm(`¿Eliminar ${ticker} de tu cartera?`)) return;
    onChange(positions.filter(p => p.ticker !== ticker));
  };

  const handleAdd = (pos) => {
    onChange([...positions, pos]);
    setShowAdd(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {positions.map(pos =>
        editingTicker === pos.ticker
          ? <EditRow key={pos.ticker} pos={pos} onSave={handleSave} onCancel={() => setEditingTicker(null)} />
          : (
            <div key={pos.ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{pos.ticker}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>{pos.shares} acc · {fmtUSD(pos.entryPrice)}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setEditingTicker(pos.ticker)} title="Editar"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, borderRadius: 4 }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleRemove(pos.ticker)} title="Eliminar"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4, borderRadius: 4 }}>
                  <X size={13} />
                </button>
              </div>
            </div>
          )
      )}

      {showAdd
        ? <AddForm existingTickers={positions.map(p => p.ticker)} onAdd={handleAdd} onClose={() => setShowAdd(false)} />
        : (
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: 'transparent', border: '1px dashed var(--border2)', borderRadius: 8, color: 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--muted)'; }}>
            <Plus size={14} /> Agregar acción
          </button>
        )
      }
    </div>
  );
}
