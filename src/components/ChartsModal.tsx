import { useEffect, useState } from 'react';

export type YearCount = { year: string; count: number };

export type ChartDataset = {
  label: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  data: YearCount[];
  total: number;
  peakYear: string;
  peakCount: number;
};

type Props = {
  datasets: ChartDataset[];
  defaultTab?: number;
  onClose: () => void;
};

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ dataset }: { dataset: ChartDataset }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { data, accentColor } = dataset;

  if (!data.length) return (
    <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '32px 0' }}>
      Sin datos disponibles
    </div>
  );

  const W = 520, H = 200;
  const padL = 36, padR = 16, padT = 28, padB = 48;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const n = data.length;
  const step = plotW / n;
  const barW = Math.max(4, step * 0.62);

  // Nice grid step
  const gridStep = maxVal <= 5 ? 1 : maxVal <= 20 ? 5 : maxVal <= 50 ? 10 : maxVal <= 100 ? 20 : 25;
  const gridLines: { y: number; label: number }[] = [];
  for (let v = gridStep; v <= maxVal; v += gridStep) {
    gridLines.push({ y: padT + plotH - (v / maxVal) * plotH, label: v });
  }

  // Cumulative line
  let cumulative = 0;
  const cumulativePoints = data.map((d, i) => {
    cumulative += d.count;
    const x = padL + i * step + step / 2;
    const y = padT + plotH - (cumulative / (dataset.total || 1)) * plotH;
    return { x, y, cum: cumulative };
  });

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Y-axis label */}
        <text x={8} y={padT + plotH / 2} textAnchor="middle" fontSize="9" fill="#9ca3af"
          transform={`rotate(-90, 8, ${padT + plotH / 2})`}>registros</text>

        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padL} y1={g.y} x2={padL + plotW} y2={g.y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padL - 4} y={g.y + 3.5} textAnchor="end" fontSize="9" fill="#9ca3af">{g.label}</text>
          </g>
        ))}

        {/* X axis line */}
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#e5e7eb" strokeWidth="1" />

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max(1, (d.count / maxVal) * plotH);
          const x = padL + i * step + (step - barW) / 2;
          const y = padT + plotH - barH;
          const isHov = hovered === i;
          const showLabel = n <= 14 || isHov;
          const labelAngle = n > 10;
          const lx = padL + i * step + step / 2;
          const ly = padT + plotH + (labelAngle ? 8 : 14);

          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}
            >
              {/* Bar */}
              <rect
                x={x} y={y} width={barW} height={barH}
                fill={accentColor}
                opacity={isHov ? 1 : 0.75}
                rx={2}
              />
              {/* Value on top */}
              {(isHov || (n <= 14 && barH > 14)) && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9"
                  fill={accentColor} fontWeight="700">{d.count}</text>
              )}
              {/* Year label */}
              {showLabel && (
                <text
                  x={lx} y={ly}
                  textAnchor={labelAngle ? 'end' : 'middle'}
                  fontSize="9" fill={isHov ? '#374151' : '#6b7280'}
                  fontWeight={isHov ? '700' : '400'}
                  transform={labelAngle ? `rotate(-40, ${lx}, ${ly})` : undefined}
                >
                  {d.year}
                </text>
              )}

              {/* Hover tooltip box */}
              {isHov && (
                <g>
                  <rect
                    x={Math.min(x + barW / 2 - 28, W - padR - 56)}
                    y={y - 32}
                    width={56} height={24} rx={4}
                    fill="#1f2937" opacity="0.92"
                  />
                  <text
                    x={Math.min(x + barW / 2, W - padR - 28)}
                    y={y - 16}
                    textAnchor="middle" fontSize="10" fill="white" fontWeight="600"
                  >
                    {d.year}: {d.count}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Cumulative trend line */}
        {data.length > 1 && (
          <>
            <polyline
              points={cumulativePoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.45"
            />
            {cumulativePoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={accentColor} opacity="0.45" />
            ))}
          </>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 10, color: '#6b7280', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: accentColor, opacity: 0.8, display: 'inline-block' }} />
          Por año
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="16" height="10"><line x1="0" y1="5" x2="16" y2="5" stroke={accentColor} strokeWidth="1.5" strokeDasharray="4,2" opacity="0.5" /></svg>
          Acumulado
        </span>
      </div>
    </div>
  );
}

// ─── Stats cards ──────────────────────────────────────────────────────────────
function StatsRow({ dataset }: { dataset: ChartDataset }) {
  const { total, peakYear, peakCount, accentColor, bgColor, borderColor, data } = dataset;
  const firstYear = data[0]?.year ?? '—';
  const lastYear = data[data.length - 1]?.year ?? '—';
  const lastCount = data[data.length - 1]?.count ?? 0;
  const firstCount = data[0]?.count ?? 0;
  const trend = firstCount > 0 ? Math.round(((lastCount - firstCount) / firstCount) * 100) : null;

  const card = (label: string, value: string | number, sub?: string) => (
    <div style={{
      flex: 1, padding: '10px 12px', background: bgColor,
      border: `1px solid ${borderColor}`, borderRadius: 10, textAlign: 'center', minWidth: 0,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: accentColor }}>{value}</div>
      <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {card('Total', total)}
      {card('Año pico', peakYear, `${peakCount} registros`)}
      {card('Período', `${firstYear}–${lastYear}`)}
      {trend !== null && card('Variación', `${trend > 0 ? '+' : ''}${trend}%`, `${firstYear} → ${lastYear}`)}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function ChartsModal({ datasets, defaultTab = 0, onClose }: Props) {
  const [tab, setTab] = useState(Math.min(defaultTab, datasets.length - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [onClose]);

  const current = datasets[tab];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={current.accentColor} style={{ width: 22, height: 22, flexShrink: 0 }}>
                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
              </svg>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Estadísticas
                </p>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  Crecimiento por año
                </h2>
              </div>
            </div>
            <button
              type="button" onClick={onClose} aria-label="Cerrar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          {datasets.length > 1 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
              {datasets.map((ds, i) => (
                <button key={i} onClick={() => setTab(i)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: `1px solid ${i === tab ? ds.accentColor : '#e5e7eb'}`,
                    background: i === tab ? ds.bgColor : 'white',
                    color: i === tab ? ds.accentColor : '#6b7280',
                    transition: 'all 0.15s',
                  }}
                >{ds.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats */}
          <StatsRow dataset={current} />

          {/* Chart */}
          <div style={{ background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: 12, padding: '16px 8px 8px' }}>
            <p style={{ margin: '0 0 8px 36px', fontSize: 11, fontWeight: 600, color: '#374151' }}>
              {current.label} registradas por año
            </p>
            <BarChart dataset={current} />
          </div>

          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
            Pasa el cursor sobre las barras para ver el valor exacto. La línea discontinua muestra el acumulado.
          </p>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '10px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', background: '#fafafa' }}>
          <button type="button" onClick={onClose}
            style={{
              padding: '7px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: 'white', background: current.accentColor, border: 'none', cursor: 'pointer',
            }}
          >Cerrar</button>
        </div>
      </div>
    </div>
  );
}
