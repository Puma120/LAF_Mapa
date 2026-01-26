import { useMemo, useState } from 'react';
import type { FosaRecord } from '../hooks/useFosasData';
import type { MasacreRecord } from '../hooks/useMasacresData';

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
};

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
}: Props) {
  const [activeTab, setActiveTab] = useState<'fosas' | 'masacres'>('fosas');
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapsedChange = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const municipiosFosas = useMemo(() => {
    const set = new Set<string>();
    for (const f of fosas) {
      const muni = f.raw?.['MUNICIPIO'] ?? f.raw?.['MUNUCUPIO'] ?? f.raw?.['Municipio'] ?? '';
      if (muni) set.add(String(muni).trim());
    }
    return Array.from(set).sort();
  }, [fosas]);

  const municipiosMasacres = useMemo(() => {
    const set = new Set<string>();
    for (const m of masacres) {
      const muni = m.raw?.['Municipio'] ?? m.raw?.['MUNICIPIO'] ?? '';
      if (muni) set.add(String(muni).trim());
    }
    return Array.from(set).sort();
  }, [masacres]);

  const allZonas = useMemo(() => {
    const set = new Set<string>();
    for (const f of fosas) {
      const zona = f.raw?.['ZONA'] ?? f.raw?.['Zona'] ?? '';
      if (zona) set.add(String(zona).trim());
    }
    return Array.from(set).sort();
  }, [fosas]);

  const allModalidades = useMemo(() => {
    const set = new Set<string>();
    for (const f of fosas) {
      const mod = f.raw?.['MODALIDAD DE FOSA'] ?? f.raw?.['MODALIDAD'] ?? '';
      if (mod) set.add(String(mod).trim());
    }
    return Array.from(set).sort();
  }, [fosas]);

  const allHallazgos = useMemo(() => {
    const set = new Set<string>();
    for (const f of fosas) {
      const hall = f.raw?.['QUIÉN HIZO EL HALLAZGO'] ?? f.raw?.['QUIEN HIZO EL HALLAZGO'] ?? '';
      if (hall) set.add(String(hall).trim());
    }
    return Array.from(set).sort();
  }, [fosas]);

  const toggleCheckbox = (field: keyof UnifiedFilters, val: string) => {
    const arr = value[field];
    if (!Array.isArray(arr)) return;
    const newArr = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
    onChange({ ...value, [field]: newArr });
  };

  return (
    <>
      <style>{`
        .unified-panel {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow: hidden;
          pointer-events: auto;
          transition: width 0.3s ease, height 0.3s ease;
        }
        .unified-panel.collapsed {
          width: 50px !important;
          height: 50px !important;
        }
        .unified-panel.collapsed .unified-header {
          padding: 0;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .collapse-btn {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: #2d3748;
          font-size: 20px;
          font-weight: normal;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          min-width: 40px;
          height: 40px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .collapse-btn:hover {
          background: #f9fafb;
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .collapse-btn.collapsed-btn {
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }
        .unified-header {
          padding: 16px 18px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .unified-header h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          color: #111;
        }
        .unified-clear {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .unified-clear:hover {
          background: #dc2626;
        }
        .unified-filters {
          flex: 1;
          overflow-y: auto;
          padding: 16px 18px;
          min-height: 0;
          pointer-events: auto;
        }
        .unified-filters::-webkit-scrollbar {
          width: 8px;
        }
        .unified-filters::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .unified-filters::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .unified-filters::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .unified-results {
          height: 300px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          pointer-events: auto;
        }
        .unified-tabs {
          display: flex;
          gap: 8px;
          padding: 12px 18px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .unified-tab {
          flex: 1;
          padding: 8px 12px;
          background: white;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
          text-align: center;
        }
        .unified-tab:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        .unified-tab.tab-fosas {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        .unified-tab.tab-masacres {
          background: #9b59b6;
          border-color: #9b59b6;
          color: white;
        }
        .unified-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 18px;
          pointer-events: auto;
        }
        .unified-list::-webkit-scrollbar {
          width: 6px;
        }
        .unified-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }
        .unified-list::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .unified-list::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        .unified-item {
          padding: 10px;
          margin-bottom: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .unified-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .unified-item strong {
          color: #111;
          display: block;
          margin-bottom: 4px;
        }
        .unified-item-meta {
          font-size: 11px;
          color: #6b7280;
        }
        .filter-section {
          margin-bottom: 18px;
        }
        .filter-title {
          font-size: 14px;
          font-weight: 600;
          color: #111;
          margin-bottom: 10px;
        }
        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .filter-option {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
        }
        .filter-option:hover {
          color: #111;
        }
        .filter-option input {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }
        .filter-input {
          width: 100%;
          padding: 9px 12px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          color: #111;
          background: white;
        }
        .filter-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .filter-input::placeholder {
          color: #9ca3af;
        }
        .zona-btns {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .zona-btn {
          padding: 8px 12px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          text-align: left;
          transition: all 0.2s;
          font-weight: 500;
        }
        .zona-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        .zona-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        .zona-clear {
          margin-top: 6px;
          padding: 6px 10px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          cursor: pointer;
          font-size: 12px;
          color: #6b7280;
          width: 100%;
          text-align: center;
          transition: all 0.2s;
        }
        .zona-clear:hover {
          background: #e5e7eb;
          color: #374151;
        }
      `}</style>

      <div className={`unified-panel ${collapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: 'auto',
          bottom: collapsed ? 140 : 140,
          left: collapsed ? 16 : 16,
          width: collapsed ? 50 : 280,
          height: collapsed ? 50 : 'calc(100vh - 180px)',
        }}
        onWheel={(e) => e.stopPropagation()}
        onWheelCapture={(e) => e.stopPropagation()}
      >
        <div className="unified-header">
          {!collapsed && <h3>Mapa de Masacres y Fosas</h3>}
          {!collapsed && <button className="unified-clear" onClick={onClear}>Limpiar</button>}
          <button 
            className={`collapse-btn ${collapsed ? 'collapsed-btn' : ''}`}
            onClick={() => handleCollapsedChange(!collapsed)}
            title={collapsed ? 'Expandir filtros' : 'Contraer filtros'}
            style={{
              position: collapsed ? 'static' : 'relative',
            }}
          >
            {collapsed ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="18" x2="14" y2="18"></line>
              </svg>
            ) : '‹'}
          </button>
        </div>

        {!collapsed && (
        <div className="unified-filters"
          onWheel={(e) => e.stopPropagation()}
          onWheelCapture={(e) => e.stopPropagation()}
        >
          {/* Mostrar */}
          <div className="filter-section">
            <div className="filter-title">Mostrar</div>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={value.showFosas}
                  onChange={(e) => onChange({ ...value, showFosas: e.target.checked })}
                />
                <span>Fosas ({filteredFosas.length})</span>
              </label>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={value.showMasacres}
                  onChange={(e) => onChange({ ...value, showMasacres: e.target.checked })}
                />
                <span>Masacres ({filteredMasacres.length})</span>
              </label>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="filter-section">
            <div className="filter-title">Búsqueda</div>
            <input
              type="text"
              className="filter-input"
              placeholder="Buscar en descripción..."
              value={value.texto}
              onChange={(e) => onChange({ ...value, texto: e.target.value })}
            />
          </div>

          {/* Filtros de Fosas */}
          {value.showFosas && (
            <>
              {/* Municipios */}
              <div className="filter-section">
                <div className="filter-title">Municipio ({value.municipio.length})</div>
                <div className="filter-options" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {municipiosFosas.map((m) => (
                    <label key={m} className="filter-option">
                      <input
                        type="checkbox"
                        checked={value.municipio.includes(m)}
                        onChange={() => toggleCheckbox('municipio', m)}
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Zona */}
              {allZonas.length > 0 && (
                <div className="filter-section">
                  <div className="filter-title">Zona ({value.zona.length})</div>
                  <div className="filter-options" style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {allZonas.map((z) => (
                      <label key={z} className="filter-option">
                        <input
                          type="checkbox"
                          checked={value.zona.includes(z)}
                          onChange={() => toggleCheckbox('zona', z)}
                        />
                        <span>{z}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Modalidad */}
              {allModalidades.length > 0 && (
                <div className="filter-section">
                  <div className="filter-title">Modalidad ({value.modalidad.length})</div>
                  <div className="filter-options">
                    {allModalidades.map((m) => (
                      <label key={m} className="filter-option">
                        <input
                          type="checkbox"
                          checked={value.modalidad.includes(m)}
                          onChange={() => toggleCheckbox('modalidad', m)}
                        />
                        <span>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Hallazgo */}
              {allHallazgos.length > 0 && (
                <div className="filter-section">
                  <div className="filter-title">Hallazgo ({value.hallazgo.length})</div>
                  <div className="filter-options">
                    {allHallazgos.map((h) => (
                      <label key={h} className="filter-option">
                        <input
                          type="checkbox"
                          checked={value.hallazgo.includes(h)}
                          onChange={() => toggleCheckbox('hallazgo', h)}
                        />
                        <span>{h}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Filtros de Masacres */}
          {value.showMasacres && !value.showFosas && (
            <>
              {/* Municipios para masacres */}
              <div className="filter-section">
                <div className="filter-title">Municipio ({value.municipio.length})</div>
                <div className="filter-options" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {municipiosMasacres.map((m) => (
                    <label key={m} className="filter-option">
                      <input
                        type="checkbox"
                        checked={value.municipio.includes(m)}
                        onChange={() => toggleCheckbox('municipio', m)}
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        )}

        {/* Lower half: Results */}
        {!collapsed && (
        <div className="unified-results"
          onWheel={(e) => e.stopPropagation()}
          onWheelCapture={(e) => e.stopPropagation()}
        >
          {/* Mostrar pestañas solo si ambos están activados */}
          {value.showFosas && value.showMasacres ? (
            <>
              <div className="unified-tabs">
                <button
                  className={`unified-tab ${activeTab === 'fosas' ? 'tab-fosas' : ''}`}
                  onClick={() => setActiveTab('fosas')}
                >
                  Fosas ({filteredFosas.length})
                </button>
                <button
                  className={`unified-tab ${activeTab === 'masacres' ? 'tab-masacres' : ''}`}
                  onClick={() => setActiveTab('masacres')}
                >
                  Masacres ({filteredMasacres.length})
                </button>
              </div>

              <div className="unified-list"
                onWheel={(e) => e.stopPropagation()}
                onWheelCapture={(e) => e.stopPropagation()}
              >
                {activeTab === 'fosas' && filteredFosas.map((f, i) => (
                  <div key={i} className="unified-item" onClick={() => onSelectFosa(f)}>
                    <strong>{f.raw?.['MUNICIPIO'] ?? f.raw?.['MUNUCUPIO'] ?? f.raw?.['Municipio'] ?? 'Sin municipio'}</strong>
                    <div className="unified-item-meta">
                      {f.raw?.['AÑO'] ?? f.raw?.['Anio'] ?? f.raw?.['Año'] ?? 'N/A'} • {f.raw?.['ZONA'] ?? 'Sin zona'}
                    </div>
                  </div>
                ))}

                {activeTab === 'masacres' && filteredMasacres.map((m, i) => (
                  <div key={i} className="unified-item" onClick={() => onSelectMasacre(m)}>
                    <strong>{m.raw?.['Municipio'] ?? m.raw?.['MUNICIPIO'] ?? 'Sin municipio'}</strong>
                    <div className="unified-item-meta">
                      {m.raw?.['año'] ?? m.raw?.['fecha'] ?? 'Sin fecha'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : value.showFosas ? (
            /* Solo fosas */
            <>
              <div className="unified-tabs">
                <button className="unified-tab tab-fosas">
                  Fosas ({filteredFosas.length})
                </button>
              </div>

              <div className="unified-list"
                onWheel={(e) => e.stopPropagation()}
                onWheelCapture={(e) => e.stopPropagation()}
              >
                {filteredFosas.map((f, i) => (
                  <div key={i} className="unified-item" onClick={() => onSelectFosa(f)}>
                    <strong>{f.raw?.['MUNICIPIO'] ?? f.raw?.['MUNUCUPIO'] ?? f.raw?.['Municipio'] ?? 'Sin municipio'}</strong>
                    <div className="unified-item-meta">
                      {f.raw?.['AÑO'] ?? f.raw?.['Anio'] ?? f.raw?.['Año'] ?? 'N/A'} • {f.raw?.['ZONA'] ?? 'Sin zona'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : value.showMasacres ? (
            /* Solo masacres */
            <>
              <div className="unified-tabs">
                <button className="unified-tab tab-masacres">
                  Masacres ({filteredMasacres.length})
                </button>
              </div>

              <div className="unified-list"
                onWheel={(e) => e.stopPropagation()}
                onWheelCapture={(e) => e.stopPropagation()}
              >
                {filteredMasacres.map((m, i) => (
                  <div key={i} className="unified-item" onClick={() => onSelectMasacre(m)}>
                    <strong>{m.raw?.['Municipio'] ?? m.raw?.['MUNICIPIO'] ?? 'Sin municipio'}</strong>
                    <div className="unified-item-meta">
                      {m.raw?.['año'] ?? m.raw?.['fecha'] ?? 'Sin fecha'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Ninguno seleccionado */
            <div className="unified-tabs">
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                Selecciona fosas o masacres para ver resultados
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </>
  );
}
