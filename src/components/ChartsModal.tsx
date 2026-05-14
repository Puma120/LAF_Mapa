import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type YearCount = { year: string; count: number };

export type ChartDataset = {
  label: string;
  municipio?: string;
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

  const W = 520, H = 320;
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
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', flex: 1, minHeight: 0, display: 'block' }}>
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
  // Population variance: σ² = Σ(xᵢ − μ)² / n
  const counts = data.map(d => d.count);
  const mean = counts.length ? counts.reduce((s, c) => s + c, 0) / counts.length : 0;
  const variance = counts.length
    ? Math.round(counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length)
    : null;

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
      {variance !== null && card('Varianza (σ²)', variance.toLocaleString(), `μ = ${Math.round(mean)}`)}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
const BAR_SVG_PATH = "M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z";

export default function ChartsModal({ datasets, defaultTab = 0, onClose }: Props) {
  const [tab, setTab] = useState(Math.min(defaultTab, datasets.length - 1));

  // ── Draggable + resizable ─────────────────────────────────────────────────
  const initW = Math.min(Math.round(window.innerWidth * 0.84), 1000);
  const initH = Math.round(window.innerHeight * 0.84);
  const [size, setSize] = useState({ w: initW, h: initH });
  const [pos,  setPos]  = useState({
    x: Math.round((window.innerWidth  - initW) / 2),
    y: Math.round((window.innerHeight - initH) / 2),
  });

  // Refs so mousemove handlers never go stale
  const sizeRef = useRef(size);
  const posRef  = useRef(pos);
  useEffect(() => { sizeRef.current = size; }, [size]);
  useEffect(() => { posRef.current  = pos;  }, [pos]);

  const dragRef   = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const resizeRef = useRef<{ mx: number; my: number; w: number; h: number }  | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const { mx, my, px, py } = dragRef.current;
        const { w, h: _h } = sizeRef.current;
        setPos({
          x: Math.max(0, Math.min(window.innerWidth  - w,  px + e.clientX - mx)),
          y: Math.max(0, Math.min(window.innerHeight - 60, py + e.clientY - my)),
        });
      }
      if (resizeRef.current) {
        const { mx, my, w: sw, h: sh } = resizeRef.current;
        const { x, y } = posRef.current;
        setSize({
          w: Math.max(380, Math.min(window.innerWidth  - x - 4, sw + e.clientX - mx)),
          h: Math.max(280, Math.min(window.innerHeight - y - 4, sh + e.clientY - my)),
        });
      }
    };
    const onUp = () => {
      dragRef.current   = null;
      resizeRef.current = null;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [onClose]);

  const current = datasets[tab];
  if (!current) return null;

  // Dedicated portal container — avoids "Target container is not a DOM element" in Strict Mode
  const portalTarget = (() => {
    const existing = document.getElementById('charts-modal-portal');
    if (existing) return existing;
    const el = document.createElement('div');
    el.id = 'charts-modal-portal';
    document.body.appendChild(el);
    return el;
  })();

  return createPortal(
    <>
      {/* Draggable / resizable modal — no overlay so map stays interactive */}
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ position: 'fixed', zIndex: 9999, left: pos.x, top: pos.y, width: size.w, height: size.h,
          boxShadow: '0 8px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — drag handle */}
        <div
          style={{ padding: '14px 20px 12px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, cursor: 'grab', userSelect: 'none' }}
          onMouseDown={e => {
            if ((e.target as HTMLElement).closest('button')) return;
            e.preventDefault();
            document.body.style.userSelect = 'none';
            dragRef.current = { mx: e.clientX, my: e.clientY, px: posRef.current.x, py: posRef.current.y };
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={current.accentColor} style={{ width: 22, height: 22, flexShrink: 0 }}>
                <path d={BAR_SVG_PATH} />
              </svg>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estadísticas</p>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{current.label}</h2>
                {current.municipio && (
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{current.municipio}</p>
                )}
              </div>
            </div>
            <button
              type="button" onClick={onClose} aria-label="Cerrar"
              onMouseDown={e => e.stopPropagation()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {datasets.length > 1 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
              {datasets.map((ds, i) => (
                <button key={i}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => setTab(i)}
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <StatsRow dataset={current} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: 12, padding: '12px 8px 8px', minHeight: 0 }}>
            <p style={{ margin: '0 0 6px 36px', fontSize: 11, fontWeight: 600, color: '#374151', flexShrink: 0 }}>Registros por año</p>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
              <BarChart dataset={current} />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', textAlign: 'center', flexShrink: 0 }}>
            Pasa el cursor sobre las barras para ver el valor exacto. La línea discontinua muestra el acumulado.
          </p>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '8px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', borderRadius: '0 0 16px 16px' }}>
          <span style={{ fontSize: 11, color: '#ff2a00', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" style={{ opacity: 0.7 }}><path d="M10 3a1 1 0 0 1 .707.293l6 6a1 1 0 0 1-1.414 1.414L10 5.414 4.707 10.707A1 1 0 0 1 3.293 9.293l6-6A1 1 0 0 1 10 3z"/><path d="M10 10a1 1 0 0 1 .707.293l6 6a1 1 0 0 1-1.414 1.414L10 12.414l-5.293 5.293a1 1 0 0 1-1.414-1.414l6-6A1 1 0 0 1 10 10z"/></svg>
            Arrastra el encabezado · Esquina ↘ para redimensionar
          </span>
          <button type="button" onClick={onClose}
            style={{ padding: '7px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'white', background: current.accentColor, border: 'none', cursor: 'pointer' }}
          >Cerrar</button>
        </div>

        {/* Resize handle — bottom-right corner */}
        <div
          style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, cursor: 'se-resize', zIndex: 1 }}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            document.body.style.userSelect = 'none';
            resizeRef.current = { mx: e.clientX, my: e.clientY, w: sizeRef.current.w, h: sizeRef.current.h };
          }}
        >
          <svg viewBox="0 0 12 12" style={{ position: 'absolute', bottom: 6, right: 6, opacity: 0.35 }} width="12" height="12">
            <path d="M11 1 1 11M11 5 5 11M11 9 9 11" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </>,
    portalTarget
  );
}
