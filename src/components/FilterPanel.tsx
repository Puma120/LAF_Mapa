import React from 'react';
import type { FosaRecord } from '../hooks/useFosasData';

type Filters = {
  anio: string[];
  municipio: string[];
  zona: string[];
  modalidad: string[];
  hallazgo: string[];
  texto: string;
};

type Props = {
  fosas: FosaRecord[];
  filtered: FosaRecord[];
  value: Filters;
  onChange: (f: Filters) => void;
  onClear: () => void;
  onSelect: (f: FosaRecord) => void;
};

const cleanYear = (s: string) => String(s).trim().replace(/\.0+$/, '');
const normalizeValue = (field: keyof Filters, v: string) => {
  if (field === 'anio') return cleanYear(v);
  return String(v).trim();
};

const getValue = (row: Record<string, any>, keys: string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const FilterPanel: React.FC<Props> = ({ 
  fosas, 
  filtered, 
  value, 
  onChange, 
  onClear, 
  onSelect 
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  const getUniqueValues = (keys: string[]): string[] => {
    const uniqueSet = new Set<string>();
    
    fosas.forEach(fosa => {
      const val = getValue(fosa.raw, keys);
      if (val) uniqueSet.add(val);
    });
    
    return Array.from(uniqueSet).sort((a, b) => 
      a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })
    );
  };

  const municipios = getUniqueValues(['MUNICIPIO', 'MUNUCUPIO', 'Municipio', 'municipio']);
  const zonas = getUniqueValues(['ZONA', 'Zona', 'zona']);
  const modalidades = getUniqueValues(['MODALIDAD DE FOSA', 'MODALIDAD', 'Modalidad', 'modalidad']);
  const hallazgos = getUniqueValues(['QUIÉN HIZO EL HALLAZGO', 'QUIEN HIZO EL HALLAZGO', 'Quien hizo el hallazgo']);

  const toggleFilter = (field: keyof Filters, option: string) => {
    if (field === 'texto') return;
    const norm = (v: string) => normalizeValue(field, v);
    const currentValues = Array.isArray(value[field]) ? value[field] as string[] : [];
    const exists = currentValues.some(v => norm(v) === option);
    const newValues = exists 
      ? currentValues.filter(v => norm(v) !== option)
      : [...currentValues, option];
    onChange({ ...value, [field]: newValues });
  };

  const handleTextChange = (texto: string) => {
    onChange({ ...value, texto });
  };

  const FilterSection: React.FC<{
    title: string;
    options: string[];
    field: keyof Filters;
  }> = ({ title, options, field }) => (
    <div className="filter-section">
      <div className="filter-title">{title}</div>
      <div className="filter-options">
        {options.length > 0 ? (
          options.map((option) => {
            const isChecked = Array.isArray(value[field]) && 
              (value[field] as string[]).some(v => normalizeValue(field, v) === option);
            return (
              <label key={option} className="filter-option">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFilter(field, option)}
                />
                <span title={option}>{option}</span>
              </label>
            );
          })
        ) : (
          <div className="no-options">Sin opciones</div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`filter-panel ${collapsed ? 'collapsed' : ''}`}
      onWheelCapture={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="panel-header">
        {!collapsed && (
          <>
            <div className="header-content">
              <h3>Filtros</h3>
              <p className="header-subtitle">Fosas Clandestinas</p>
            </div>
            <button onClick={onClear} className="clear-button">
              Limpiar
            </button>
          </>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="collapse-button"
          title={collapsed ? 'Expandir filtros' : 'Contraer filtros'}
          style={{
            position: collapsed ? 'absolute' : 'relative',
            right: collapsed ? '8px' : 'auto',
            fontSize: '24px',
            zIndex: 1001
          }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Upper half: Scrollable filters */}
      {!collapsed && (
      <div className="filters-container">
        
        {/* Búsqueda de texto */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Buscar en descripción..."
            value={value.texto || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filtros (Año removido: se controla desde la línea del tiempo) */}
        <div className="filters-section">
          <FilterSection title="Municipio" options={municipios} field="municipio" />
          <FilterSection title="Zona" options={zonas} field="zona" />
          <FilterSection title="Modalidad" options={modalidades} field="modalidad" />
          <FilterSection title="Hallazgo" options={hallazgos} field="hallazgo" />
        </div>

      </div>
      )}

      {/* Lower half: Fixed results (always visible) */}
      {!collapsed && (
      <div className="results-container">
        <div className="results-header">
          <strong>
            {(value.municipio.length > 0 || value.zona.length > 0 || 
              value.modalidad.length > 0 || value.hallazgo.length > 0 || value.texto.trim() !== '')
              ? `Resultados (${filtered.length})`
              : `Todas las fosas (${filtered.length})`}
          </strong>
        </div>
        
        <div className="results-list">
          {filtered.length > 0 ? (
            filtered.map((fosa, index) => {
              const fecha = getValue(fosa.raw, ['FECHA DEL HALLAZGO', 'Fecha', 'FECHA', 'fecha']);
              const anioRaw = getValue(fosa.raw, ['AÑO', 'Anio', 'Año', 'año']);
              const anio = anioRaw ? anioRaw.replace(/\.0+$/, '') : '';
              const municipio = getValue(fosa.raw, ['MUNICIPIO', 'MUNUCUPIO', 'Municipio', 'municipio']);
              const modalidad = getValue(fosa.raw, ['MODALIDAD DE FOSA', 'MODALIDAD', 'Modalidad', 'modalidad']);
              
              return (
                <div 
                  key={`${index}`}
                  className="result-item"
                  onClick={() => onSelect(fosa)}
                >
                  <div className="result-main">
                    <div className="result-date">{fecha ? fecha.slice(0, 10) : 'Sin fecha'}</div>
                    <div className="result-municipio" title={municipio}>
                      {municipio || 'Sin municipio'}
                    </div>
                  </div>
                  <div className="result-details">
                    <span className="result-year">{anio}</span>
                    <span className="result-modalidad" title={modalidad}>
                      {modalidad || 'Sin modalidad'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results">
              No se encontraron resultados con los filtros aplicados
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default FilterPanel;
export type { Filters };