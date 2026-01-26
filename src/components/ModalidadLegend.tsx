import React from 'react';

type ModalidadInfo = {
  modalidad: string;
  color: [number, number, number, number];
  count: number;
};

type Props = {
  modalidades: ModalidadInfo[];
};

const ModalidadLegend: React.FC<Props> = ({ modalidades }) => {
  if (modalidades.length === 0) return null;

  return (
    <div
      className="text-[#2d3748] bottom-[200px] left-82 py-2 px-3.5"
      style={{
        position: 'fixed',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        maxWidth: 300,
        pointerEvents: 'auto',
      }}
      onWheelCapture={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Positioned directly above the 'Cambiar mapa' button */}
      <h4 className='text-sm font-bold mb-2 text-[#2d3748]'>
        Modalidades Filtradas
      </h4>
      
      <div className='flex flex-col gap-2'>
        {modalidades.map((item, index) => {
          const isPozo = item.modalidad.trim().toLowerCase() === 'pozo para riego';
          return (
            <div
              key={index}
              className='flex items-center gap-2'
            >
              {isPozo && (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: `rgba(${item.color[0]}, ${item.color[1]}, ${item.color[2]}, ${item.color[3] / 255})`,
                    border: `2px solid rgba(${item.color[0]}, ${item.color[1]}, ${item.color[2]}, 0.9)`,
                    flexShrink: 0,
                  }}
                />
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <p className='font-semibold text-xs'>
                  {isPozo ? 'Zona de alta densidad de pozos para riego' : item.modalidad}
                </p>
                <p className='text-xs'>
                  {/* #718096 */}
                  {item.count} {item.count > 1 ? 'fosas' : 'fosa'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModalidadLegend;
