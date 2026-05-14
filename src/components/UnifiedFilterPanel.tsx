import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { FosaRecord } from '../hooks/useFosasData';
import type { MasacreRecord } from '../hooks/useMasacresData';
import type { ShapeConfig } from '../hooks/useShapefileLoader';
import type { DelitoCategoriaInfo } from '../hooks/useDelitosData';
import ChartsModal, { type ChartDataset } from './ChartsModal';

// Normalization map for hallazgo parts (key: lowercase, value: canonical display name)
// Merges case variants, aliases, and secondary actors from compound entries
const HALLAZGO_NORMALIZE: Record<string, string> = {
  'la voz de los desaparecidos': 'Grupo Ciudadano de Búsqueda',
  'colectivo la voz de los desaparecidos': 'Grupo Ciudadano de Búsqueda',
  'grupo ciudadano de búsqueda': 'Grupo Ciudadano de Búsqueda',
  'grupo ciudadano de busqueda': 'Grupo Ciudadano de Búsqueda',
  'familias de personas desaparecidas': 'Familiares',
  'poblador': 'Pobladores',
  'poblador menor de edad': 'Pobladores',
};
// Max length for a valid hallazgo part — anything longer is a note, not an actor name
const HALLAZGO_MAX_LEN = 60;

function normalizeHallazgoPart(part: string): string | null {
  if (part.length > HALLAZGO_MAX_LEN) return null; // discard long artifact strings
  return HALLAZGO_NORMALIZE[part.toLowerCase()] ?? part;
}

// Helper: wrap matching text in a <mark> element with yellow highlight
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} style={{ background: '#fef08a', color: '#92400e', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
          : part
      )}
    </>
  );
}

export type UnifiedFilters = {
  anio: string[];
  municipio: string[];
  texto: string;
  zona: string[];
  modalidad: string[];
  hallazgo: string[];
  showFosas: boolean;
  showMasacres: boolean;
};

type Props = {
  fosas: FosaRecord[];
  masacres: MasacreRecord[];
  filteredFosas: FosaRecord[];
  filteredMasacres: MasacreRecord[];
  value: UnifiedFilters;
  onChange: (v: UnifiedFilters) => void;
  onClear: () => void;
  onSelectFosa: (f: FosaRecord) => void;
  onSelectMasacre: (m: MasacreRecord) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  layers: ShapeConfig[];
  activeLayers: string[];
  onToggleLayer: (layerId: string) => void;
  loadingLayers: string[];
  delitoCategorias?: DelitoCategoriaInfo[];
  onEnterAmozoc?: () => void;
  onEnterInfo?: () => void;
};

const PANEL_W = 270;

export default function UnifiedFilterPanel({
  fosas,
  masacres,
  filteredFosas,
  filteredMasacres,
  value,
  onChange,
  onClear,
  onSelectFosa,
  onSelectMasacre,
  onCollapsedChange,
  layers,
  activeLayers,
  onToggleLayer,
  loadingLayers,
  delitoCategorias = [],
  onEnterAmozoc,
  onEnterInfo,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [chartTarget, setChartTarget] = useState<'fosas' | 'masacres' | null>(null);

  // Prevent the map from zooming when the wheel is used over the panel.
  // React's synthetic onWheel stops bubbling in React's tree but native deck.gl
  // listeners attached to document/window are unaffected. A native listener added
  // directly on the panel element fires before propagation reaches those listeners.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const stopWheel = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stopWheel);
    return () => el.removeEventListener('wheel', stopWheel);
  }, []);
  const [showCorredorInfo, setShowCorredorInfo] = useState(false);
  const [showFosasInfo, setShowFosasInfo] = useState(false);
  const [showMasacresInfo, setShowMasacresInfo] = useState(false);
  const [showModalidadFilter, setShowModalidadFilter] = useState(false);
  const [showHallazgoFilter, setShowHallazgoFilter] = useState(false);
  const [expandedCorredores, setExpandedCorredores] = useState<Set<string>>(new Set());
  const [expandedCategorias, setExpandedCategorias] = useState<Set<number>>(new Set());

  const toggleCorredorExpanded = useCallback((id: string) => {
    setExpandedCorredores(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCategoriaExpanded = useCallback((catId: number) => {
    setExpandedCategorias(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  const handleCollapse = (next: boolean) => {
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const allMunicipios = useMemo(() => {
    const set = new Set<string>();
    for (const f of fosas) {
      const m = f.raw?.['MUNICIPIO'] ?? f.raw?.['MUNUCUPIO'] ?? f.raw?.['Municipio'] ?? '';
      if (m) set.add(String(m).trim());
    }
    for (const m of masacres) {
      const mu = m.raw?.['Municipio'] ?? m.raw?.['MUNICIPIO'] ?? '';
      if (mu) set.add(String(mu).trim());
    }
    return Array.from(set).sort();
  }, [fosas, masacres]);

  const filteredMunis = useMemo(() =>
    searchText
      ? allMunicipios.filter(m => m.toLowerCase().includes(searchText.toLowerCase()))
      : allMunicipios,
    [allMunicipios, searchText]
  );

  const toggleMunicipio = (m: string) => {
    const arr = value.municipio;
    onChange({ ...value, municipio: arr.includes(m) ? arr.filter(x => x !== m) : [...arr, m] });
  };

  const allModalidades = useMemo(() => {
    const set = new Set<string>();
    for (const f of fosas) {
      const mod = (f.raw?.['MODALIDAD DE FOSA'] ?? f.raw?.['MODALIDAD'] ?? '').toString().trim();
      set.add(mod || 'Se desconoce');
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [fosas]);

  const allHallazgos = useMemo(() => {
    const set = new Set<string>();
    for (const f of fosas) {
      const raw = (f.raw?.['QUIÉN HIZO EL HALLAZGO'] ?? f.raw?.['QUIEN HIZO EL HALLAZGO'] ?? '').toString().trim();
      if (!raw) {
        set.add('Se desconoce');
      } else {
        // Split compound entries like "Pobladores. La Voz de los Desaparecidos"
        const parts = raw.split('.').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
        for (const part of parts) {
          const normalized = normalizeHallazgoPart(part);
          if (normalized) set.add(normalized);
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [fosas]);

  const toggleModalidad = (m: string) => {
    const arr = value.modalidad;
    const next = arr.includes(m) ? arr.filter(x => x !== m) : [...arr, m];
    // Hide masacres when any fosa-specific filter is active to reduce distraction
    onChange({ ...value, modalidad: next, showMasacres: next.length > 0 ? false : value.showMasacres });
  };

  const toggleHallazgo = (h: string) => {
    const arr = value.hallazgo;
    const next = arr.includes(h) ? arr.filter(x => x !== h) : [...arr, h];
    // Hide masacres when any fosa-specific filter is active to reduce distraction
    onChange({ ...value, hallazgo: next, showMasacres: next.length > 0 ? false : value.showMasacres });
  };

  // ── Chart data (all fosas/masacres, unfiltered) ─────────────────────────
  const fosasChartData = useMemo((): ChartDataset => {
    const counts: Record<string, number> = {};
    for (const f of fosas) {
      const raw = String(f.raw?.['AÑO'] ?? f.raw?.['Anio'] ?? f.raw?.['Año'] ?? f.raw?.['año'] ?? '').trim();
      const y = raw.replace(/\.0+$/, ''); // strip trailing .0 from float-encoded years
      if (y && /^\d{4}$/.test(y)) counts[y] = (counts[y] ?? 0) + 1;
    }
    const data = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([year, count]) => ({ year, count }));
    const total = data.reduce((s, d) => s + d.count, 0);
    const peak = data.reduce((p, c) => c.count > p.count ? c : p, { year: '—', count: 0 });
    return { label: 'Fosas Clandestinas', accentColor: '#dc2626', bgColor: '#fff5f5', borderColor: '#fecaca', data, total, peakYear: peak.year, peakCount: peak.count };
  }, [fosas]);

  const masacresChartData = useMemo((): ChartDataset => {
    const counts: Record<string, number> = {};
    for (const m of masacres) {
      const raw = String(m.raw?.['año'] ?? m.raw?.['Año'] ?? m.raw?.['AÑO'] ?? '').trim();
      const y = raw.replace(/\.0+$/, '');
      if (y && /^\d{4}$/.test(y)) counts[y] = (counts[y] ?? 0) + 1;
    }
    const data = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([year, count]) => ({ year, count }));
    const total = data.reduce((s, d) => s + d.count, 0);
    const peak = data.reduce((p, c) => c.count > p.count ? c : p, { year: '—', count: 0 });
    return { label: 'Masacres', accentColor: '#7c3aed', bgColor: '#fdf4ff', borderColor: '#e9d5ff', data, total, peakYear: peak.year, peakCount: peak.count };
  }, [masacres]);

  const layerDotStyle = (layer: ShapeConfig): React.CSSProperties => ({
    backgroundColor: layer.color
      ? `rgba(${layer.color[0]},${layer.color[1]},${layer.color[2]},0.5)`
      : 'rgba(65,105,225,0.5)',
    border: `2px solid ${layer.strokeColor
      ? `rgba(${layer.strokeColor[0]},${layer.strokeColor[1]},${layer.strokeColor[2]},0.85)`
      : 'rgba(65,105,225,0.85)'}`,
  });

  return (
    <>
      {/* Collapsed tab */}
      {collapsed && (
        <button
          onClick={() => handleCollapse(false)}
          title="Expandir panel"
          style={{
            position: 'fixed', top: '50%', left: 0,
            transform: 'translateY(-50%)', zIndex: 1100,
            background: 'white', border: '1px solid #e5e7eb',
            borderLeft: 'none', borderRadius: '0 8px 8px 0',
            boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
            width: 28, height: 72,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#374151',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Main panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', top: 0, left: collapsed ? -PANEL_W : 0,
          width: PANEL_W, height: '100vh',
          background: 'white', display: 'flex', flexDirection: 'column',
          zIndex: 1100, transition: 'left 0.3s ease',
          boxShadow: '2px 0 16px rgba(0,0,0,0.12)', pointerEvents: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 18px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Panel de capas</span>
            <button
              onClick={() => handleCollapse(true)}
              title="Contraer panel"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6b7280', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: '#e5e7eb', flexShrink: 0 }} />

        {/* Scrollable body */}
        <div
          className="panel-scroll-body"
          style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* Title + clear */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
              Mapa interactivo<br />
            </h2>
            <button
              onClick={onClear}
              style={{
                flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#dc2626',
                background: 'none', border: '1px solid #fca5a5',
                borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
              }}
            >
              Limpiar
            </button>
          </div>

          {/* MOSTRAR */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Mostrar geolocalizaciones
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13, color: '#111827' }}>
                  <input type="checkbox" checked={value.showFosas}
                    onChange={e => onChange({ ...value, showFosas: e.target.checked })}
                    style={{ width: 15, height: 15, accentColor: '#ef4444', cursor: 'pointer' }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                    Fosas Clandestinas
                  </span>
                  {/* Gráfica button */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setChartTarget('fosas'); }}
                    title="Ver gráfica por año"
                    style={{
                      width: 16, height: 16, borderRadius: '50%', border: '1px solid #9ca3af',
                      background: 'transparent', color: '#9ca3af',
                      fontSize: 10, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, flexShrink: 0,
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 10, height: 10 }}>
                      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowFosasInfo(!showFosasInfo); }}
                    title="¿Qué es una fosa clandestina?"
                    style={{
                      width: 16, height: 16, borderRadius: '50%', border: '1px solid #9ca3af',
                      background: showFosasInfo ? '#ef4444' : 'transparent',
                      color: showFosasInfo ? '#fff' : '#9ca3af',
                      fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1, padding: 0, flexShrink: 0,
                    }}
                  >?</button>
                </label>
                {showFosasInfo && (
                  <div style={{ marginTop: 4, marginLeft: 24, padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, color: '#991b1b', lineHeight: 1.5 }}>
                    Una <strong>fosa clandestina</strong> es un entierro ilegal donde se ocultan restos humanos. Los puntos rojos en el mapa representan ubicaciones documentadas de fosas encontradas en el estado de Puebla.
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13, color: '#111827' }}>
                  <input type="checkbox" checked={value.showMasacres}
                    onChange={e => onChange({ ...value, showMasacres: e.target.checked })}
                    style={{ width: 15, height: 15, accentColor: '#7c3aed', cursor: 'pointer' }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9b59b6', border: '2px solid #4b0082', display: 'inline-block', flexShrink: 0 }} />
                    Masacres
                  </span>
                  {/* Gráfica button */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setChartTarget('masacres'); }}
                    title="Ver gráfica por año"
                    style={{
                      width: 16, height: 16, borderRadius: '50%', border: '1px solid #9ca3af',
                      background: 'transparent', color: '#9ca3af',
                      fontSize: 10, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, flexShrink: 0,
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 10, height: 10 }}>
                      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMasacresInfo(!showMasacresInfo); }}
                    title="¿Qué es una masacre?"
                    style={{
                      width: 16, height: 16, borderRadius: '50%', border: '1px solid #9ca3af',
                      background: showMasacresInfo ? '#7c3aed' : 'transparent',
                      color: showMasacresInfo ? '#fff' : '#9ca3af',
                      fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1, padding: 0, flexShrink: 0,
                    }}
                  >?</button>
                </label>
                {showMasacresInfo && (
                  <div style={{ marginTop: 4, marginLeft: 24, padding: '6px 10px', background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 6, fontSize: 11, color: '#4c1d95', lineHeight: 1.5 }}>
                    Una <strong>masacre</strong> es un evento donde tres o mas personas fueron asesinadas en un mismo hecho. Los puntos morados en el mapa representan eventos documentados en Puebla.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BUSQUEDA POR TEXTO */}
          {(value.showFosas || value.showMasacres) && (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Busqueda por texto
            </p>
            <input
              type="text"
              placeholder="Buscar en descripción, zona..."
              value={value.texto}
              onChange={e => onChange({ ...value, texto: e.target.value })}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6,
                outline: 'none', color: '#111', background: '#f9fafb',
              }}
            />
            {value.texto && (
              <button onClick={() => onChange({ ...value, texto: '' })}
                style={{ marginTop: 4, fontSize: 10, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Limpiar texto ×
              </button>
            )}
          </div>
          )}

          {/* FILTRO POR MODALIDAD DE FOSA */}
          {value.showFosas && (
          <div>
            <button
              onClick={() => setShowModalidadFilter(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                marginBottom: showModalidadFilter ? 8 : 0,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Modalidad de fosa {value.modalidad.length > 0 && <span style={{ color: '#ef4444' }}>({value.modalidad.length})</span>}
                </p>
                <span style={{ fontSize: 9, color: '#ef4444', fontStyle: 'italic', opacity: 0.7 }}>Solo fosas clandestinas</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="#9ca3af"
                style={{ transition: 'transform 0.2s', transform: showModalidadFilter ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd"/>
              </svg>
            </button>
            {showModalidadFilter && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
                {allModalidades.map(mod => (
                  <label key={mod} style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    fontSize: 12, color: '#374151', padding: '4px 6px', borderRadius: 5,
                    background: value.modalidad.includes(mod) ? '#fef2f2' : 'transparent',
                    border: `1px solid ${value.modalidad.includes(mod) ? '#fecaca' : 'transparent'}`,
                  }}>
                    <input type="checkbox"
                      checked={value.modalidad.includes(mod)}
                      onChange={() => toggleModalidad(mod)}
                      style={{ width: 13, height: 13, accentColor: '#ef4444', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{mod}</span>
                  </label>
                ))}
              </div>
            )}
            {value.modalidad.length > 0 && (
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {value.modalidad.map(m => (
                  <button key={m} onClick={() => toggleModalidad(m)}
                    style={{ fontSize: 10, padding: '2px 7px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, cursor: 'pointer', color: '#dc2626' }}>
                    {m} ×
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* FILTRO POR QUIÉN HIZO EL HALLAZGO */}
          {value.showFosas && (
          <div>
            <button
              onClick={() => setShowHallazgoFilter(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                marginBottom: showHallazgoFilter ? 8 : 0,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Quién hizo el hallazgo {value.hallazgo.length > 0 && <span style={{ color: '#ef4444' }}>({value.hallazgo.length})</span>}
                </p>
                <span style={{ fontSize: 9, color: '#ef4444', fontStyle: 'italic', opacity: 0.7 }}>Solo fosas clandestinas</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="#9ca3af"
                style={{ transition: 'transform 0.2s', transform: showHallazgoFilter ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd"/>
              </svg>
            </button>
            {showHallazgoFilter && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
                {allHallazgos.map(h => (
                  <label key={h} style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    fontSize: 12, color: '#374151', padding: '4px 6px', borderRadius: 5,
                    background: value.hallazgo.includes(h) ? '#fdf4ff' : 'transparent',
                    border: `1px solid ${value.hallazgo.includes(h) ? '#e9d5ff' : 'transparent'}`,
                  }}>
                    <input type="checkbox"
                      checked={value.hallazgo.includes(h)}
                      onChange={() => toggleHallazgo(h)}
                      style={{ width: 13, height: 13, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{h}</span>
                  </label>
                ))}
              </div>
            )}
            {value.hallazgo.length > 0 && (
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {value.hallazgo.map(h => (
                  <button key={h} onClick={() => toggleHallazgo(h)}
                    style={{ fontSize: 10, padding: '2px 7px', background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 12, cursor: 'pointer', color: '#7c3aed' }}>
                    {h} ×
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* BUSQUEDA POR MUNICIPIO */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Busqueda por municipio
            </p>
            <input
              type="text" placeholder="Buscar municipio..." value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                fontSize: 12, border: '1px solid #d1d5db', borderRadius: 6,
                outline: 'none', color: '#111', background: '#f9fafb',
              }}
            />
            {searchText && (
              <div style={{ marginTop: 6, maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredMunis.length === 0
                  ? <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Sin resultados</p>
                  : filteredMunis.map(m => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                      <input type="checkbox" checked={value.municipio.includes(m)} onChange={() => toggleMunicipio(m)}
                        style={{ width: 13, height: 13, cursor: 'pointer' }} />
                      {m}
                    </label>
                  ))
                }
              </div>
            )}
            {value.municipio.length > 0 && !searchText && (
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {value.municipio.map(m => (
                  <button key={m} onClick={() => toggleMunicipio(m)}
                    style={{ fontSize: 10, padding: '2px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, cursor: 'pointer', color: '#1d4ed8' }}>
                    {m} 
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CASO AMOZOC */}
          {onEnterAmozoc && (
          <div>
            <button
              onClick={onEnterAmozoc}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600,
                color: '#fff', background: '#b91c1c', border: 'none', borderRadius: 8,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#991b1b')}
              onMouseLeave={e => (e.currentTarget.style.background = '#b91c1c')}
            >
              Caso Amozoc
            </button>
          </div>
          )}

          {/* SELECCIONAR CORREDORES */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              Seleccionar corredores
              <button
                onClick={(e) => { e.stopPropagation(); setShowCorredorInfo(!showCorredorInfo); }}
                title="¿Qué es un corredor?"
                style={{
                  width: 16, height: 16, borderRadius: '50%', border: '1px solid #9ca3af',
                  background: showCorredorInfo ? '#3b82f6' : 'transparent',
                  color: showCorredorInfo ? '#fff' : '#9ca3af',
                  fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1, padding: 0, flexShrink: 0,
                }}
              >?</button>
            </p>
            {showCorredorInfo && (
              <div style={{ marginBottom: 8, padding: '8px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11, color: '#1e40af', lineHeight: 1.5 }}>
                Un <strong>corredor socioterritorial</strong> es una expresión territorial de un dispositivo de poder que articula elementos espaciales, normativos, institucionales, económicos y delictivos para controlar el territorio.
                <button onClick={() => onEnterInfo?.()}
                  style={{ display: 'block', marginTop: 6, fontSize: 10, fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  Leer más
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {layers.filter(l => !l.parentId).map(layer => {
                const isActive = activeLayers.includes(layer.id);
                const isLoading = loadingLayers.includes(layer.id);
                const childLayers = layers.filter(l => l.parentId === layer.id);
                const hasCentroDelitos = layer.id === 'homicidio_doloso';
                const hasChildren = hasCentroDelitos ? delitoCategorias.length > 0 : childLayers.length > 0;
                const isExpanded = expandedCorredores.has(layer.id);
                return (
                  <div key={layer.id}>
                    <label
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 13, color: '#111827',
                        background: isActive ? '#f0f7ff' : '#f9fafb',
                        border: `1px solid ${isActive ? '#bfdbfe' : '#e5e7eb'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, ...layerDotStyle(layer) }} />
                      <span style={{ flex: 1, fontWeight: isActive ? 600 : 400 }}>{layer.name}</span>
                      {hasChildren && isActive && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCorredorExpanded(layer.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: '#6b7280' }}
                          title={isExpanded ? 'Ocultar capas' : 'Ver capas'}
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
                            style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      )}
                      {isLoading ? (
                        <svg style={{ width: 14, height: 14, animation: 'spin 1s linear infinite', color: '#3b82f6' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <input type="checkbox" checked={isActive} onChange={() => onToggleLayer(layer.id)}
                          onClick={e => e.stopPropagation()}
                          style={{ width: 14, height: 14, accentColor: '#3b82f6', cursor: 'pointer' }} />
                      )}
                    </label>

                    {/* Corredor Centro: 3-level hierarchy (Categoria -> Tipo de delito) */}
                    {hasCentroDelitos && isActive && isExpanded && delitoCategorias.length > 0 && (
                      <div style={{ marginLeft: 14, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {delitoCategorias.map(cat => {
                          const isCatExpanded = expandedCategorias.has(cat.id);
                          const catHasActive = cat.delitos.some(d => activeLayers.includes(`delito_${d}`));
                          const [cr, cg, cb] = cat.color;
                          const catColorCSS = `rgb(${cr},${cg},${cb})`;
                          const catColorBg = `rgba(${cr},${cg},${cb},0.08)`;
                          const catColorBgActive = `rgba(${cr},${cg},${cb},0.15)`;
                          const catColorBorder = `rgba(${cr},${cg},${cb},0.3)`;
                          const catColorBorderActive = `rgba(${cr},${cg},${cb},0.55)`;
                          return (
                            <div key={cat.id}>
                              <button
                                onClick={() => toggleCategoriaExpanded(cat.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                                  padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                                  fontSize: 11, fontWeight: 600,
                                  color: catHasActive ? catColorCSS : '#374151',
                                  background: catHasActive ? catColorBgActive : catColorBg,
                                  border: `1px solid ${catHasActive ? catColorBorderActive : catColorBorder}`,
                                  transition: 'all 0.15s', textAlign: 'left',
                                }}
                              >
                                <span style={{
                                  width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                                  background: catColorCSS, opacity: catHasActive ? 1 : 0.5,
                                }} />
                                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"
                                  style={{ transition: 'transform 0.2s', transform: isCatExpanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.17 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02z" clipRule="evenodd"/>
                                </svg>
                                <span style={{ flex: 1, lineHeight: 1.3 }}>{cat.name}</span>
                              </button>
                              {isCatExpanded && (
                                <div style={{ marginLeft: 12, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {cat.delitos.map(delito => {
                                    const delitoId = `delito_${delito}`;
                                    const delitoActive = activeLayers.includes(delitoId);
                                    return (
                                      <label key={delito}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: 7,
                                          padding: '4px 7px', borderRadius: 5, cursor: 'pointer',
                                          fontSize: 11, color: '#111827',
                                          background: delitoActive ? catColorBgActive : '#fafafa',
                                          border: `1px solid ${delitoActive ? catColorBorderActive : '#f3f4f6'}`,
                                          transition: 'all 0.15s',
                                        }}
                                      >
                                        <span style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                                          background: delitoActive ? `rgba(${cr},${cg},${cb},0.6)` : 'rgba(156,163,175,0.3)',
                                          border: `1.5px solid ${delitoActive ? `rgba(${cr},${cg},${cb},0.9)` : 'rgba(156,163,175,0.5)'}`,
                                        }} />
                                        <span style={{ flex: 1, fontWeight: delitoActive ? 600 : 400 }}>{delito}</span>
                                        <input type="checkbox" checked={delitoActive} onChange={() => onToggleLayer(delitoId)}
                                          onClick={e => e.stopPropagation()}
                                          style={{ width: 12, height: 12, accentColor: catColorCSS, cursor: 'pointer' }} />
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Child layers (e.g. desapariciones under municipios or corredor) */}
                    {!hasCentroDelitos && isActive && isExpanded && childLayers.length > 0 && (
                      <div style={{ marginLeft: 18, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Tipo de violencia
                        </p>
                        {childLayers.map(child => {
                          const childActive = activeLayers.includes(child.id);
                          const childLoading = loadingLayers.includes(child.id);
                          return (
                            <label key={child.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                                fontSize: 12, color: '#111827',
                                background: childActive ? '#fef3f2' : '#fafafa',
                                border: `1px solid ${childActive ? '#fecaca' : '#e5e7eb'}`,
                                transition: 'all 0.15s',
                              }}
                            >
                              <div style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, ...layerDotStyle(child) }} />
                              <span style={{ flex: 1, fontWeight: childActive ? 600 : 400 }}>{child.name}</span>
                              {childLoading ? (
                                <svg style={{ width: 12, height: 12, animation: 'spin 1s linear infinite', color: '#3b82f6' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <input type="checkbox" checked={childActive} onChange={() => onToggleLayer(child.id)}
                                  onClick={e => e.stopPropagation()}
                                  style={{ width: 13, height: 13, accentColor: '#ef4444', cursor: 'pointer' }} />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Resultados
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {value.showFosas && (
                <div style={{ flex: 1, padding: '8px 10px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{filteredFosas.length}</div>
                  <div style={{ fontSize: 10, color: '#7f1d1d', marginTop: 1 }}>Fosas</div>
                </div>
              )}
              {value.showMasacres && (
                <div style={{ flex: 1, padding: '8px 10px', background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>{filteredMasacres.length}</div>
                  <div style={{ fontSize: 10, color: '#4c1d95', marginTop: 1 }}>Masacres</div>
                </div>
              )}
            </div>
          </div>

          {/* Results list */}
          {(value.showFosas || value.showMasacres) && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {value.showFosas ? 'Fosas' : 'Masacres'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
                {value.showFosas && filteredFosas.map((f, i) => {
                  const muni = String(f.raw?.['MUNICIPIO'] ?? f.raw?.['MUNUCUPIO'] ?? f.raw?.['Municipio'] ?? 'Sin municipio');
                  const anioVal = String(f.raw?.['AÑO'] ?? f.raw?.['Anio'] ?? f.raw?.['Año'] ?? 'N/A');
                  const zonaVal = f.raw?.['ZONA'] ? String(f.raw['ZONA']) : '';
                  return (
                    <button key={i} onClick={() => onSelectFosa(f)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#111' }}>
                      <strong style={{ display: 'block', marginBottom: 2 }}>
                        {highlightText(muni, value.texto)}
                      </strong>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>
                        {highlightText(anioVal, value.texto)}
                        {zonaVal ? <>{'  '}{highlightText(zonaVal, value.texto)}</> : ''}
                      </span>
                    </button>
                  );
                })}
                {value.showMasacres && filteredMasacres.map((m, i) => {
                  const muni = String(m.raw?.['Municipio'] ?? m.raw?.['MUNICIPIO'] ?? 'Sin municipio');
                  const fechaVal = String(m.raw?.['año'] ?? m.raw?.['fecha'] ?? 'Sin fecha');
                  return (
                    <button key={`m-${i}`} onClick={() => onSelectMasacre(m)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: 'white', border: '1px solid #e9d5ff', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#111' }}>
                      <strong style={{ display: 'block', marginBottom: 2 }}>
                        {highlightText(muni, value.texto)}
                      </strong>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>
                        {highlightText(fechaVal, value.texto)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Charts Modal */}
      {chartTarget && (
        <ChartsModal
          datasets={chartTarget === 'fosas'
            ? [fosasChartData]
            : [masacresChartData]
          }
          onClose={() => setChartTarget(null)}
        />
      )}
    </>
  );
}
