import { useEffect } from 'react';

export interface MunicipioProperties {
  CVEGEO?: string;
  CVE_ENT?: string;
  CVE_MUN?: string;
  NOMGEO?: string;
  _index?: number;
  _layerId?: string;
  _layerName?: string;
  [key: string]: any;
}

type Props = {
  properties: MunicipioProperties;
  onClose: () => void;
  yearRange?: [number, number]; // Rango de años de la línea del tiempo
};

// Campos internos que no queremos mostrar
const INTERNAL_FIELDS = ['_index', '_layerId', '_layerName'];

// Nombres amigables para campos comunes
const FIELD_LABELS: Record<string, string> = {
  CVEGEO: 'Código Geográfico',
  CVE_ENT: 'Código de Entidad',
  CVE_MUN: 'Código de Municipio',
  NOMGEO: 'Nombre',
  NOM_ENT: 'Estado',
  NOM_MUN: 'Municipio',
  NOMBRE: 'Nombre',
  FECHA: 'Fecha',
  ANIO: 'Año',
  DESCRIPCION: 'Descripción',
  OBSERVACIONES: 'Observaciones',
  TIPO: 'Tipo',
  CATEGORIA: 'Categoría',
};

// Verificar si es un municipio del corredor (tiene campos DPFGE_)
function isCorredorMunicipio(properties: MunicipioProperties): boolean {
  return Object.keys(properties).some(key => key.startsWith('DPFGE_'));
}

// Obtener desapariciones por año filtradas por el rango de tiempo
function getDesaparicionesPorAnio(
  properties: MunicipioProperties, 
  yearRange: [number, number]
): { year: number; count: number }[] {
  const result: { year: number; count: number }[] = [];
  const [startYear, endYear] = yearRange;
  
  for (let year = startYear; year <= endYear; year++) {
    const key = `DPFGE_${year}`;
    const value = properties[key];
    if (value !== undefined && value !== null) {
      const count = typeof value === 'number' ? value : parseInt(value, 10);
      if (!isNaN(count)) {
        result.push({ year, count });
      }
    }
  }
  
  return result;
}

export default function MunicipioPopup({ properties, onClose, yearRange }: Props) {
  // Cerrar con tecla Escape para mayor accesibilidad
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [onClose]);

  const layerName = properties._layerName || 'Polígono';
  const titleField = properties.NOMGEO || properties.NOMBRE || properties.NOM_MUN || null;
  
  // Verificar si es del corredor (tiene datos DPFGE_)
  const isCorredor = isCorredorMunicipio(properties);
  
  // Obtener desapariciones filtradas por año si hay yearRange
  const desaparicionesPorAnio = isCorredor && yearRange 
    ? getDesaparicionesPorAnio(properties, yearRange) 
    : [];
  
  // Calcular total de desapariciones en el rango
  const totalDesapariciones = desaparicionesPorAnio.reduce((sum, d) => sum + d.count, 0);
  
  // Para municipios NO del corredor, mostrar todos los campos
  const visibleFields = !isCorredor 
    ? Object.entries(properties)
        .filter(([key]) => !INTERNAL_FIELDS.includes(key))
        .filter(([, value]) => value != null && String(value).trim() !== '')
    : [];

  return (
    <div
      className="fixed bg-white/[0.96] backdrop-blur-[8px] rounded-xl p-0 flex flex-col overflow-hidden cursor-default w-80 border border-white/30 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',system-ui,sans-serif] overscroll-contain right-5 top-12 max-h-[70vh] sm:top-28 lg:top-24"
      onClick={e => e.stopPropagation()}
      onWheelCapture={e => e.stopPropagation()}
      onMouseDownCapture={e => e.stopPropagation()}
      onPointerDownCapture={e => e.stopPropagation()}
      onTouchStartCapture={e => e.stopPropagation()}
      onTouchMoveCapture={e => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="false"
    >
      <div className='flex justify-between px-5 py-3 flex-shrink-0 border-b border-black/[0.08] bg-[#3182ce]/10'>
        <h2 className='font-semibold text-base text-[#2d3748] m-0 flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#3182ce]">
            <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
          </svg>
          {isCorredor ? 'Municipio del Corredor' : layerName}
        </h2>
        <button
          className='cursor-pointer text-gray-400 hover:text-[#e53e3e] font-semibold rounded-full'
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
          aria-label="Cerrar"
          title="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4 flex-1 overflow-y-auto text-sm text-[#2d3748] leading-relaxed">
        {/* Nombre del municipio */}
        {titleField && (
          <div className="mb-4 pb-3 border-b border-gray-200">
            <p className="text-xs text-[#718096] uppercase tracking-wide mb-1">Municipio</p>
            <p className="text-xl font-bold text-[#2d3748]">{titleField}</p>
          </div>
        )}

        {/* Para municipios del corredor: mostrar desapariciones por año */}
        {isCorredor && yearRange && (
          <>
            {/* Total de desapariciones */}
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 uppercase tracking-wide mb-1">
                Total de Desapariciones ({yearRange[0]} - {yearRange[1]})
              </p>
              <p className="text-2xl font-bold text-red-700">{totalDesapariciones.toLocaleString()}</p>
            </div>

            {/* Desglose por año */}
            {desaparicionesPorAnio.length > 0 && (
              <div>
                <p className="text-xs text-[#718096] uppercase tracking-wide mb-2">Desglose por Año</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {desaparicionesPorAnio.map(({ year, count }) => (
                    <div 
                      key={year} 
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-[#4a5568] font-medium">{year}</span>
                      <span className={`font-bold ${count > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {desaparicionesPorAnio.length === 0 && (
              <p className="text-gray-500 italic text-center py-4">
                Sin datos de desapariciones en este rango
              </p>
            )}
          </>
        )}

        {/* Para otros municipios: mostrar todos los campos */}
        {!isCorredor && (
          <div className="space-y-2">
            {visibleFields.map(([key, value]) => {
              if (titleField && (key === 'NOMGEO' || key === 'NOMBRE' || key === 'NOM_MUN')) {
                return null;
              }
              const label = FIELD_LABELS[key.toUpperCase()] || key;
              const displayValue = String(value);
              return (
                <div key={key} className="flex items-start justify-between bg-gray-50 rounded-lg px-3 py-2 gap-2">
                  <span className="text-[#718096] text-xs flex-shrink-0">{label}</span>
                  <span className="font-medium text-right break-words max-w-[60%]">{displayValue}</span>
                </div>
              );
            })}
            {visibleFields.length === 0 && (
              <p className="text-gray-500 italic text-center py-4">Sin información disponible</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
