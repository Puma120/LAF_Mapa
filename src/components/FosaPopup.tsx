import { useEffect } from 'react';
import type { FosaRecord } from '../hooks/useFosasData';

type Props = {
  x: number;
  y: number;
  feature: FosaRecord;
  onClose: () => void;
};

export default function FosaPopup({ feature, onClose }: Props) {
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
      <div className='flex justify-between px-5 py-3 flex-shrink-0 border-b border-black/[0.08] bg-[#f8f9fa]/80'>
        <h2 className='font-semibold text-base text-[#2d3748] m-0'>Fosa Clandestina</h2>
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
        <div className='font-medium'>
          <p className='font-semibold text-sm text-[#4a5568] uppercase tracking-[0.5px] mb-2'>Detalles específicos:</p>
          {municipio && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Municipio:</span> {municipio}</p>}
          {fecha && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Fecha:</span> <span className='text-[#3182ce] font-medium'>{fecha}</span></p>}
          {anio && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Año:</span> <span className='font-medium'>{anio}</span></p>}
          {zona && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Zona:</span> {zona}</p>}
          {cuerpos && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Cuerpos:</span> <span className='font-medium'>{cuerpos}</span></p>}
          {modalidad && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Modalidad:</span> {modalidad}</p>}
          {sitio && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Sitio:</span> {sitio}</p>}
          {quien && <p className='text-[#2d3748] mb-1'><span className='text-[#718096]'>Hallazgo:</span> {quien}</p>}
        </div>

        {descripcion && (
          <>
            <hr className='my-4 border-t border-black/[0.05]' />
            <p className='font-semibold text-sm text-[#4a5568] uppercase tracking-[0.5px] mb-2'>Descripción:</p>
            <div className='bg-white border border-[#e2e8f0] p-3 rounded-lg leading-snug text-justify text-[#2d3748]'>
              {descripcion.length > 550
                ? <span>{descripcion.slice(0, 550)}…</span>
                : <span>{descripcion}</span>
              }
            </div>
          </>
        )}
        
        {enlace && (
          <>
            <hr className='my-4 border-t border-black/[0.05]' />
            <p className='font-semibold text-sm text-[#4a5568] uppercase tracking-[0.5px] mb-2'>Enlaces:</p>
            <div className='bg-white border border-[#e2e8f0] p-3 rounded-lg'>
              {enlace.split(/\s+/).map((url: string, i: number) => (
                <div key={i} className='mb-2 last:mb-0'>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className='text-[#3182ce] hover:underline break-all transition-colors duration-200 hover:text-[#2c5aa0]'
                  >
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}