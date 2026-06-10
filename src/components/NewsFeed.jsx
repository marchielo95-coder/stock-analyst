export default function NewsFeed({ news, ticker }) {
  if (!news) return null;

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = (now - d) / 1000 / 3600;
      if (diff < 1) return `hace ${Math.round(diff * 60)} min`;
      if (diff < 24) return `hace ${Math.round(diff)}h`;
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
    } catch { return ''; }
  };

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14,
      }}>
        📰 Noticias recientes — {ticker}
      </p>

      {news.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>No se encontraron noticias recientes.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  transition: 'background 0.12s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 5, fontWeight: 500 }}>
                      {item.title}
                    </p>
                    {item.summary && (
                      <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 5,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {item.summary}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{item.source}</span>
                      <span style={{ color: 'var(--border2)', fontSize: 10 }}>·</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.7 }}>{formatDate(item.pubDate)}</span>
                    </div>
                  </div>
                  <span style={{ color: 'var(--muted)', fontSize: 14, flexShrink: 0, marginTop: 2, opacity: 0.5 }}>↗</span>
                </div>
              </div>
              {i < news.length - 1 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '0 14px' }} />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
