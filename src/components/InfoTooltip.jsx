import { useState, useRef } from 'react';

export default function InfoTooltip({ text, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    }
    setVisible(true);
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setVisible(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 14, height: 14, borderRadius: '50%',
          background: 'rgba(100,116,139,0.25)',
          color: '#94a3b8', fontSize: 9, fontWeight: 700,
          cursor: 'default', flexShrink: 0,
          userSelect: 'none', lineHeight: 1,
        }}
      >
        i
      </span>

      {visible && (
        <div style={{
          position: 'fixed',
          left: coords.x,
          top: coords.y - 8,
          transform: 'translate(-50%, -100%)',
          background: '#1e2d45',
          border: '1px solid #243450',
          borderRadius: 8,
          padding: '8px 12px',
          maxWidth: 240,
          fontSize: 12,
          color: '#cbd5e1',
          lineHeight: 1.5,
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1e2d45',
          }} />
          {text}
        </div>
      )}
    </>
  );
}
