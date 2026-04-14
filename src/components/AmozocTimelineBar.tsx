interface AmozocTimelineBarProps {
  panelWidth: number;
}

export default function AmozocTimelineBar({ panelWidth }: AmozocTimelineBarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: panelWidth,
        right: 0,
        height: 110,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.98) 100%)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '0 32px',
        zIndex: 1050,
        pointerEvents: 'auto',
        transition: 'left 0.3s ease',
      }}
    >
      {/* Stat cards */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <StatCard
          value="--.--%"
          label="Casos que siguen en desaparicion"
          color="#dc2626"
          bg="#fef2f2"
          border="#fecaca"
        />
        <div style={{ width: 1, height: 48, background: '#e5e7eb' }} />
        <StatCard
          value="--"
          label="Total de casos registrados"
          color="#111827"
          bg="#f9fafb"
          border="#e5e7eb"
        />
        <div style={{ width: 1, height: 48, background: '#e5e7eb' }} />
        <StatCard
          value="--"
          label="Fosas clandestinas encontradas"
          color="#dc2626"
          bg="#fef2f2"
          border="#fecaca"
        />
        <div style={{ width: 1, height: 48, background: '#e5e7eb' }} />
        <StatCard
          value="--"
          label="Masacres documentadas"
          color="#7c3aed"
          bg="#fdf4ff"
          border="#e9d5ff"
        />
      </div>

      {/* Wireframe note */}
      <div style={{
        position: 'absolute', right: 16, bottom: 8,
        fontSize: 9, color: '#d97706', fontStyle: 'italic',
      }}>
        Datos preliminares - wireframe
      </div>
    </div>
  );
}

function StatCard({ value, label, color, bg, border }: {
  value: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div style={{ textAlign: 'center', minWidth: 120 }}>
      <div style={{
        fontSize: 26, fontWeight: 800, color, lineHeight: 1,
        padding: '6px 16px', background: bg, border: `1px solid ${border}`,
        borderRadius: 8, display: 'inline-block',
      }}>
        {value}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 10, color: '#6b7280', lineHeight: 1.3 }}>
        {label}
      </p>
    </div>
  );
}
