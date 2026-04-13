import { useMemo, useState, useCallback } from 'react';
import type { FosaRecord } from '../hooks/useFosasData';
import type { MasacreRecord } from '../hooks/useMasacresData';
import type { ShapeConfig } from '../hooks/useShapefileLoader';

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
  onEnterAmozoc,
  onEnterInfo,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCorredorInfo, setShowCorredorInfo] = useState(false);
  const [expandedCorredores, setExpandedCorredores] = useState<Set<string>>(new Set());

  const toggleCorredorExpanded = useCallback((id: string) => {
    setExpandedCorredores(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
        style={{
          position: 'fixed', top: 0, left: collapsed ? -PANEL_W : 0,
          width: PANEL_W, height: '100vh',
          background: 'white', display: 'flex', flexDirection: 'column',
          zIndex: 1100, transition: 'left 0.3s ease',
          boxShadow: '2px 0 16px rgba(0,0,0,0.12)', pointerEvents: 'auto',
        }}
        onWheel={e => e.stopPropagation()}
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
          style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}
          onWheel={e => e.stopPropagation()}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13, color: '#111827' }}>
                <input type="checkbox" checked={value.showFosas}
                  onChange={e => onChange({ ...value, showFosas: e.target.checked })}
                  style={{ width: 15, height: 15, accentColor: '#ef4444', cursor: 'pointer' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                  Fosas Clandestinas
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13, color: '#111827' }}>
                <input type="checkbox" checked={value.showMasacres}
                  onChange={e => onChange({ ...value, showMasacres: e.target.checked })}
                  style={{ width: 15, height: 15, accentColor: '#7c3aed', cursor: 'pointer' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9b59b6', border: '2px solid #4b0082', display: 'inline-block', flexShrink: 0 }} />
                  Masacres
                </span>
              </label>
            </div>
          </div>

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
                      {childLayers.length > 0 && isActive && (
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
                    {/* Sub-menu for child layers (violence types) */}
                    {isActive && isExpanded && childLayers.length > 0 && (
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
                {value.showFosas && filteredFosas.map((f, i) => (
                  <button key={i} onClick={() => onSelectFosa(f)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#111' }}>
                    <strong style={{ display: 'block', marginBottom: 2 }}>
                      {f.raw?.['MUNICIPIO'] ?? f.raw?.['MUNUCUPIO'] ?? f.raw?.['Municipio'] ?? 'Sin municipio'}
                    </strong>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      {f.raw?.['AÑO'] ?? f.raw?.['Anio'] ?? f.raw?.['Año'] ?? 'N/A'}
                      {f.raw?.['ZONA'] ? `  ${f.raw['ZONA']}` : ''}
                    </span>
                  </button>
                ))}
                {value.showMasacres && filteredMasacres.map((m, i) => (
                  <button key={`m-${i}`} onClick={() => onSelectMasacre(m)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: 'white', border: '1px solid #e9d5ff', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#111' }}>
                    <strong style={{ display: 'block', marginBottom: 2 }}>
                      {m.raw?.['Municipio'] ?? m.raw?.['MUNICIPIO'] ?? 'Sin municipio'}
                    </strong>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      {m.raw?.['año'] ?? m.raw?.['fecha'] ?? 'Sin fecha'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
