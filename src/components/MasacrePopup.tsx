import { useEffect } from 'react';
import type { MasacreRecord } from '../hooks/useMasacresData';

type Props = {
  feature: MasacreRecord;
  onClose: () => void;
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

export default function MasacrePopup({ feature, onClose }: Props) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const fecha = getValue(feature.raw, ['fecha', 'Fecha', 'FECHA']);
  const municipio = getValue(feature.raw, ['Municipio', 'MUNICIPIO', 'municipio']);
  const lugar = getValue(feature.raw, ['LUGAR', 'Lugar', 'lugar']);
  const descripcion = getValue(feature.raw, ['Descripción resumida', 'DESCRIPCIÓN', 'Descripcion', 'DESCRIPCION']);

  return (
    <div style={{
      position: 'fixed',
      top: 120,
      right: 20,
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 10000,
      maxWidth: '450px',
      width: '400px',
      maxHeight: 'calc(100vh - 140px)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#9b59b6' }}>
          Masacre - {municipio || 'Sin municipio'}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0 4px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div className="popup-content" style={{
        padding: '20px',
        overflowY: 'auto',
        flex: 1,
      }}>
        <style>{`
          .popup-content::-webkit-scrollbar {
            width: 8px;
          }
          .popup-content::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .popup-content::-webkit-scrollbar-thumb {
            background: #9b59b6;
            border-radius: 4px;
          }
          .popup-content::-webkit-scrollbar-thumb:hover {
            background: #8e44ad;
          }
        `}</style>

        {fecha && (
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#374151', fontSize: '13px' }}>Fecha:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#111', fontSize: '14px' }}>{fecha}</p>
          </div>
        )}

        {lugar && (
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#374151', fontSize: '13px' }}>Lugar:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#111', fontSize: '14px' }}>{lugar}</p>
          </div>
        )}

        {descripcion && (
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#374151', fontSize: '13px' }}>Descripción:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#111', fontSize: '14px', lineHeight: 1.6 }}>
              {descripcion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
