import { useEffect } from 'react';
import type { ChartDataset } from './ChartsModal';

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
  yearRange?: [number, number];
  onOpenChart?: (properties: MunicipioProperties, chartType: 'corredor' | 'desap' | 'delito') => void;
};

// Campos internos que no queremos mostrar
const INTERNAL_FIELDS = new Set([
  '_index', '_layerId', '_layerName', '_hasDesapData', '_hasDelitoData', '_delitoType',
]);

// Campos con prefijo que son datos procesados (no mostrar en genérico)
const HIDDEN_PREFIXES = ['_DESAP_', 'DPFGE_', '_DELITO_'];

// Campos de código/identificadores que no aportan al usuario
const CODE_FIELDS = new Set([
  'CVEGEO', 'CVE_ENT', 'CVE_MUN', 'CVE_LOC', 'CVE_AGEE', 'CVE_AGEM',
]);

// Nombres amigables para campos comunes
const FIELD_LABELS: Record<string, string> = {
  NOMGEO: 'Municipio',
  NOM_ENT: 'Estado',
  NOM_MUN: 'Municipio',
  NOMBRE: 'Nombre',
  'Tipo de de': 'Tipo de Delito',
  'CategorÃa': 'Categoría',
  'Categoria': 'Categoría',
  'Incidencia': 'Incidencia',
  FECHA: 'Fecha',
  ANIO: 'Año',
  DESCRIPCION: 'Descripción',
  OBSERVACIONES: 'Observaciones',
  TIPO: 'Tipo',
  CATEGORIA: 'Categoría',
  POBLACION: 'Población',
};

// Verificar si es un municipio del corredor (tiene campos DPFGE_)
function isCorredorMunicipio(properties: MunicipioProperties): boolean {
  return Object.keys(properties).some(key => key.startsWith('DPFGE_'));
}

// Verificar si es un municipio con datos CSV de desapariciones
function isDesapMunicipio(properties: MunicipioProperties): boolean {
  return properties._hasDesapData === true;
}

// Obtener desapariciones por año filtradas por el rango de tiempo (corredor - DPFGE_)
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

// Obtener datos detallados de desapariciones del CSV por año
interface DesapYearDetail {
  year: number;
  hombres: number;
  mujeres: number;
  total: number;
  poblacion: number;
  tasa: number;
}

function getDesapCSVPorAnio(
  properties: MunicipioProperties,
  yearRange: [number, number]
): DesapYearDetail[] {
  const result: DesapYearDetail[] = [];
  const [startYear, endYear] = yearRange;
  
  for (let year = startYear; year <= endYear; year++) {
    const total = properties[`_DESAP_TOTAL_${year}`];
    if (total !== undefined && total !== null) {
      result.push({
        year,
        hombres: Number(properties[`_DESAP_H_${year}`]) || 0,
        mujeres: Number(properties[`_DESAP_M_${year}`]) || 0,
        total: Number(total) || 0,
        poblacion: Number(properties[`_DESAP_POB_${year}`]) || 0,
        tasa: Number(properties[`_DESAP_TASA_${year}`]) || 0,
      });
    }
  }
  
  return result;
}

// Obtener datos de delitos del CSV por año
interface DelitoYearDetail {
  year: number;
  incidencia: number;
  poblacion: number;
  tasa: number;
}

function getDelitoPorAnio(
  properties: MunicipioProperties,
  yearRange: [number, number]
): DelitoYearDetail[] {
  const result: DelitoYearDetail[] = [];
  const [startYear, endYear] = yearRange;

  for (let year = startYear; year <= endYear; year++) {
    const tasa = properties[`_DELITO_TASA_${year}`];
    if (tasa !== undefined && tasa !== null) {
      result.push({
        year,
        incidencia: Number(properties[`_DELITO_INCIDENCIA_${year}`]) || 0,
        poblacion: Number(properties[`_DELITO_POBLACION_${year}`]) || 0,
        tasa: Number(tasa) || 0,
      });
    }
  }

  return result;
}

// ─── Standalone exported builder — lets App.tsx recompute reactively ──────────
export function buildMunicipioDataset(
  properties: MunicipioProperties,
  yearRange: [number, number],
  chartType: 'corredor' | 'desap' | 'delito'
): ChartDataset | null {
  const titleField = properties.NOMGEO || properties.NOMBRE || properties.NOM_MUN || null;
  const delitoType = properties._delitoType as string | undefined;

  if (chartType === 'corredor') {
    const rows = getDesaparicionesPorAnio(properties, yearRange);
    if (!rows.length) return null;
    const data = rows.map(d => ({ year: String(d.year), count: d.count }));
    const total = data.reduce((s, d) => s + d.count, 0);
    const peak = data.reduce((p, c) => c.count > p.count ? c : p, { year: '—', count: 0 });
    return { label: 'Desapariciones', municipio: titleField ?? undefined, accentColor: '#dc2626', bgColor: '#fff5f5', borderColor: '#fecaca', data, total, peakYear: peak.year, peakCount: peak.count };
  }
  if (chartType === 'desap') {
    const rows = getDesapCSVPorAnio(properties, yearRange);
    if (!rows.length) return null;
    const data = rows.map(d => ({ year: String(d.year), count: d.total }));
    const total = data.reduce((s, d) => s + d.count, 0);
    const peak = data.reduce((p, c) => c.count > p.count ? c : p, { year: '—', count: 0 });
    return { label: 'Desapariciones', municipio: titleField ?? undefined, accentColor: '#dc2626', bgColor: '#fff5f5', borderColor: '#fecaca', data, total, peakYear: peak.year, peakCount: peak.count };
  }
  if (chartType === 'delito') {
    const rows = getDelitoPorAnio(properties, yearRange);
    if (!rows.length) return null;
    const data = rows.map(d => ({ year: String(d.year), count: d.incidencia }));
    const total = data.reduce((s, d) => s + d.count, 0);
    const peak = data.reduce((p, c) => c.count > p.count ? c : p, { year: '—', count: 0 });
    return { label: delitoType || 'Delito', municipio: titleField ?? undefined, accentColor: '#dc2626', bgColor: '#fff5f5', borderColor: '#fecaca', data, total, peakYear: peak.year, peakCount: peak.count };
  }
  return null;
}

export default function MunicipioPopup({ properties, onClose, yearRange, onOpenChart }: Props) {

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
  
  // Determinar tipo de municipio
  const isDelito = properties._hasDelitoData === true;
  const isCorredor = !isDelito && isCorredorMunicipio(properties);
  const isDesap = !isDelito && isDesapMunicipio(properties);
  const isGeneric = !isCorredor && !isDesap && !isDelito;
  
  // Datos del corredor (DPFGE_)
  const corredorPorAnio = isCorredor && yearRange 
    ? getDesaparicionesPorAnio(properties, yearRange) 
    : [];
  const totalCorredor = corredorPorAnio.reduce((sum, d) => sum + d.count, 0);

  // Datos del CSV de desapariciones
  const desapPorAnio = isDesap && yearRange
    ? getDesapCSVPorAnio(properties, yearRange)
    : [];
  const totalDesap = desapPorAnio.reduce((sum, d) => sum + d.total, 0);
  const totalHombres = desapPorAnio.reduce((sum, d) => sum + d.hombres, 0);
  const totalMujeres = desapPorAnio.reduce((sum, d) => sum + d.mujeres, 0);

  // Datos de delitos del CSV
  const delitoType = properties._delitoType as string | undefined;
  const delitoPorAnio = isDelito && yearRange
    ? getDelitoPorAnio(properties, yearRange)
    : [];
  const totalIncidencia = delitoPorAnio.reduce((sum, d) => sum + d.incidencia, 0);


  
  // Para municipios genéricos — filtrar campos sin información relevante
  const visibleFields = isGeneric 
    ? Object.entries(properties)
        .filter(([key]) => !INTERNAL_FIELDS.has(key))
        .filter(([key]) => !CODE_FIELDS.has(key))
        .filter(([key]) => !HIDDEN_PREFIXES.some(p => key.startsWith(p)))
        .filter(([key]) => {
          // Ocultar el campo de nombre si ya lo mostramos como título
          if (titleField && (key === 'NOMGEO' || key === 'NOMBRE' || key === 'NOM_MUN')) return false;
          return true;
        })
        .filter(([, value]) => value != null && String(value).trim() !== '')
    : [];

  // Detectar si es capa de homicidio doloso
  const isHomicidio = properties._layerId === 'homicidio_doloso';
  
  // Título del header según tipo
  const headerTitle = isDelito
    ? (delitoType || 'Delito')
    : isDesap 
      ? 'Desapariciones' 
      : isCorredor 
        ? 'Municipio del Corredor' 
        : isHomicidio
          ? 'Homicidio Doloso'
          : layerName;

  // Color del header según tipo
  const headerBg = isDelito ? 'bg-red-50' : isDesap || isCorredor ? 'bg-red-50' : isHomicidio ? 'bg-orange-50' : 'bg-[#3182ce]/10';
  const iconColor = isDelito ? 'text-red-600' : isDesap || isCorredor ? 'text-red-600' : isHomicidio ? 'text-orange-600' : 'text-[#3182ce]';

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
      <div className={`flex justify-between px-5 py-3 flex-shrink-0 border-b border-black/[0.08] ${headerBg}`}>
        <h2 className='font-semibold text-base text-[#2d3748] m-0 flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${iconColor}`}>
            <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
          </svg>
          {headerTitle}
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

        {/* ===== DESAPARICIONES CSV ===== */}
        {isDesap && yearRange && (
          <>
            {/* Resumen total */}
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 uppercase tracking-wide mb-1">
                Total Desapariciones ({yearRange[0]} – {yearRange[1]})
              </p>
              <p className="text-2xl font-bold text-red-700">{totalDesap.toLocaleString()}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-blue-700">
                  <span className="font-semibold">H:</span> {totalHombres.toLocaleString()}
                </span>
                <span className="text-pink-700">
                  <span className="font-semibold">M:</span> {totalMujeres.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Tabla por año */}
            {desapPorAnio.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#718096] uppercase tracking-wide m-0">Desglose por Año</p>
                  <button
                    onClick={() => onOpenChart?.(properties, 'desap')}
                    title="Ver gráfica"
                    className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded px-1.5 py-0.5 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
                    </svg>
                    Gráfica
                  </button>
                </div>
                {/* Encabezado de tabla */}
                <div className="flex items-center justify-between bg-gray-200 rounded-t-lg px-3 py-1.5 text-xs font-semibold text-gray-600">
                  <span className="w-12">Año</span>
                  <span className="w-8 text-center text-blue-700">H</span>
                  <span className="w-8 text-center text-pink-700">M</span>
                  <span className="w-10 text-center">Total</span>
                  <span className="w-16 text-right">Tasa</span>
                </div>
                <div className="space-y-0 max-h-52 overflow-y-auto border border-gray-200 rounded-b-lg">
                  {desapPorAnio.map(({ year, hombres, mujeres, total, tasa }) => (
                    <div 
                      key={year} 
                      className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <span className="text-[#4a5568] font-medium w-12">{year}</span>
                      <span className="w-8 text-center text-blue-600">{hombres}</span>
                      <span className="w-8 text-center text-pink-600">{mujeres}</span>
                      <span className={`w-10 text-center font-bold ${total > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {total}
                      </span>
                      <span className="w-16 text-right text-gray-500 text-xs">
                        {tasa.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-right">Tasa por 100,000 hab.</p>
              </div>
            )}

            {desapPorAnio.length === 0 && (
              <p className="text-gray-500 italic text-center py-4">
                Sin datos de desapariciones en este rango
              </p>
            )}
          </>
        )}

        {/* ===== DELITO (CSV) ===== */}
        {isDelito && yearRange && (
          <>
            {/* Resumen total */}
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 uppercase tracking-wide mb-1">
                {delitoType} ({yearRange[0]} – {yearRange[1]})
              </p>
              <p className="text-2xl font-bold text-red-700">{totalIncidencia.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Incidencias totales</p>
            </div>

            {/* Tabla por año */}
            {delitoPorAnio.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#718096] uppercase tracking-wide m-0">Desglose por Año</p>
                  <button
                    onClick={() => onOpenChart?.(properties, 'delito')}
                    title="Ver gráfica"
                    className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded px-1.5 py-0.5 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
                    </svg>
                    Gráfica
                  </button>
                </div>
                <div className="flex items-center justify-between bg-gray-200 rounded-t-lg px-3 py-1.5 text-xs font-semibold text-gray-600">
                  <span className="w-12">Año</span>
                  <span className="w-16 text-center">Incidencia</span>
                  <span className="w-20 text-center">Población</span>
                  <span className="w-14 text-right">Tasa</span>
                </div>
                <div className="space-y-0 max-h-52 overflow-y-auto border border-gray-200 rounded-b-lg">
                  {delitoPorAnio.map(({ year, incidencia, poblacion, tasa }) => (
                    <div 
                      key={year} 
                      className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <span className="text-[#4a5568] font-medium w-12">{year}</span>
                      <span className={`w-16 text-center font-bold ${incidencia > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {incidencia.toLocaleString()}
                      </span>
                      <span className="w-20 text-center text-gray-500 text-xs">
                        {poblacion.toLocaleString()}
                      </span>
                      <span className="w-14 text-right text-gray-500 text-xs">
                        {tasa.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-right">Tasa por 100,000 hab.</p>
              </div>
            )}

            {delitoPorAnio.length === 0 && (
              <p className="text-gray-500 italic text-center py-4">
                Sin datos en este rango de años
              </p>
            )}
          </>
        )}

        {/* ===== CORREDOR (DPFGE_) ===== */}
        {isCorredor && yearRange && (
          <>
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 uppercase tracking-wide mb-1">
                Total de Desapariciones ({yearRange[0]} – {yearRange[1]})
              </p>
              <p className="text-2xl font-bold text-red-700">{totalCorredor.toLocaleString()}</p>
            </div>

            {corredorPorAnio.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#718096] uppercase tracking-wide m-0">Desglose por Año</p>
                  <button
                    onClick={() => onOpenChart?.(properties, 'corredor')}
                    title="Ver gráfica"
                    className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded px-1.5 py-0.5 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
                    </svg>
                    Gráfica
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {corredorPorAnio.map(({ year, count }) => (
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

            {corredorPorAnio.length === 0 && (
              <p className="text-gray-500 italic text-center py-4">
                Sin datos de desapariciones en este rango
              </p>
            )}
          </>
        )}

        {/* ===== GENÉRICO ===== */}
        {isGeneric && (
          <div className="space-y-2">
            {visibleFields.length > 0 ? visibleFields.map(([key, value]) => {
              const label = FIELD_LABELS[key] || FIELD_LABELS[key.toUpperCase()] || key;
              let displayValue = String(value);
              // Corregir encoding corrupto en valores de texto
              displayValue = displayValue
                .replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é')
                .replace(/Ã­/g, 'í').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ')
                .replace(/Ã\x81/g, 'Á').replace(/Ã‰/g, 'É').replace(/Ã"/g, 'Ó')
                .replace(/Ãš/g, 'Ú').replace(/Ã'/g, 'Ñ');
              
              // Estilo especial para valores numéricos importantes
              const isNumeric = !isNaN(Number(value)) && key !== 'ANIO';
              
              return (
                <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 gap-3">
                  <span className="text-[#718096] text-xs font-medium flex-shrink-0">{label}</span>
                  <span className={`font-semibold text-right break-words max-w-[60%] ${isNumeric ? 'text-[#2d3748] text-base' : 'text-[#4a5568]'}`}>
                    {displayValue}
                  </span>
                </div>
              );
            }) : (
              <p className="text-gray-500 italic text-center py-4">Sin información disponible</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
