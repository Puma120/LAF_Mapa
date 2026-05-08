import { useEffect } from 'react';
import type { FosaRecord } from '../hooks/useFosasData';

type Props = {
  x: number;
  y: number;
  feature: FosaRecord;
  onClose: () => void;
  onOpenDetail: () => void;
};

export default function FosaPopup({ feature, onClose, onOpenDetail }: Props) {
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
  const r = feature.raw || {};
  const get = (keys: string[]) => keys.map(k => r[k]).find(v => v != null && String(v).trim() !== '');
  const fecha = get(['FECHA DEL HALLAZGO','Fecha','FECHA']);
  const anio = get(['AÑO','Anio','Año']);
  const municipio = get(['MUNICIPIO','MUNUCUPIO']);
  const zona = get(['ZONA']);
  const cuerpos = get(['CUERPOS ENCONTRADOS','CUERPOS']);
  const modalidad = get(['MODALIDAD DE FOSA','MODALIDAD']);
  const sitio = get(['CARACTERÍSTICAS DEL SITIO DE HALLAZGO','CARACTERISTICAS DEL SITIO DE HALLAZGO']);
  const quien = get(['QUIÉN HIZO EL HALLAZGO','QUIEN HIZO EL HALLAZGO']);
  const descripcion = get(['DESCRIPCIÓN','Descripcion','DESCRIPCION']);
  const enlace = get(['Unnamed: 13','ENLACE','Link']);

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
      <div className='flex justify-between px-5 py-3 flex-shrink-0 border-b border-black/[0.08] bg-red-50'>
        <h2 className='font-semibold text-base text-[#2d3748] m-0 flex items-center gap-2'>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-600">
            <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
          </svg>
          Fosa Clandestina
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
          {fecha && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Fecha:</span> <span className='text-[#3182ce] font-medium'>{fecha}</span></p>}
          {anio && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Año:</span> <span className='font-medium'>{anio}</span></p>}
          {zona && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Zona:</span> {zona}</p>}
          {cuerpos && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Cuerpos:</span> <span className='font-medium'>{cuerpos}</span></p>}
          {modalidad && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Modalidad:</span> {modalidad}</p>}
          {sitio && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Sitio:</span> {sitio}</p>}
          {quien && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Hallazgo:</span> {quien}</p>}
        </div>

        {/* Botón Ver más → abre modal de detalle */}
        {(descripcion || enlace) && (
          <button
            onClick={onOpenDetail}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#c53030] bg-red-50 hover:bg-red-100 border border-red-200 transition-colors duration-150"
          >
            Ver más
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}