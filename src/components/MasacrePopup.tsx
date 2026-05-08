import { useEffect } from 'react';
import type { MasacreRecord } from '../hooks/useMasacresData';

type Props = {
  feature: MasacreRecord;
  onClose: () => void;
  onOpenDetail: () => void;
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

// Extract URLs from the Links field (lines starting with http or preceded by whitespace)
const extractLinks = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s)]+/g;
  return Array.from(new Set(text.match(urlRegex) ?? []));
};

export default function MasacrePopup({ feature, onClose, onOpenDetail }: Props) {

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

  const r = feature.raw || {};
  const fecha = getValue(r, ['fecha', 'Fecha', 'FECHA']);
  const anio = getValue(r, ['año', 'Año', 'ANO', 'AÑO']);
  const municipio = getValue(r, ['Municipio', 'MUNICIPIO', 'municipio']);
  const numero = getValue(r, ['Número', 'Numero', 'NÚMERO']);
  const descripcion = getValue(r, ['Descripción resumida', 'DESCRIPCIÓN', 'Descripcion', 'DESCRIPCION']);
  const linksRaw = getValue(r, ['Links', 'LINKS', 'Link', 'LINK']);
  const urls = linksRaw ? extractLinks(linksRaw) : [];

  return (
    <div
      className="fixed bg-white/[0.96] backdrop-blur-[8px] rounded-xl p-0 flex flex-col overflow-hidden cursor-default w-80 border border-white/30 font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',system-ui,sans-serif] overscroll-contain right-5 top-12 max-h-[calc(100vh-350px)] sm:top-28 lg:top-24"
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
      <div className='flex justify-between px-5 py-3 flex-shrink-0 border-b border-black/[0.08] bg-purple-50'>
        <h2 className='font-semibold text-base text-[#2d3748] m-0 flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-600">
            <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
          </svg>
          Masacre
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

      <div className="px-5 py-3 flex-1 overflow-y-auto scroll-smooth overscroll-contain touch-pan-y text-xs text-[#2d3748] leading-relaxed popup-content">
        {/* Municipio destacado */}
        {municipio && (
          <div className="mb-3 pb-3 border-b border-gray-200">
            <p className="text-xs text-[#718096] uppercase tracking-wide mb-0.5">Municipio</p>
            <p className="text-base font-bold text-[#2d3748] m-0">{municipio}</p>
          </div>
        )}

        <div className='font-medium'>
          <p className='font-semibold text-sm text-[#4a5568] uppercase tracking-[0.5px] mb-2'>Detalles:</p>
          {fecha && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Fecha:</span> <span className='text-purple-600 font-medium'>{fecha}</span></p>}
          {anio && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Año:</span> <span className='font-medium'>{anio}</span></p>}
          {numero && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>N.º caso:</span> {numero}</p>}
        </div>

        {/* Botón Ver más → abre modal de detalle */}
        {(descripcion || urls.length > 0) && (
          <button
            onClick={onOpenDetail}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors duration-150"
          >
            Ver más
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

