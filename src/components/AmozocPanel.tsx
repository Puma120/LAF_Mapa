import { useState } from 'react';

const PANEL_W = 270;

interface AmozocPanelProps {
  onExit: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function AmozocPanel({ onExit, onCollapsedChange }: AmozocPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = (next: boolean) => {
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

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
        <div style={{ padding: '14px 18px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Caso Amozoc</span>
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
          style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}
          onWheel={e => e.stopPropagation()}
        >
          {/* Title */}
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#7f1d1d', lineHeight: 1.3 }}>
              Amozoc de Mota
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
              Municipio del estado de Puebla
            </p>
          </div>

          {/* Representacion / Estigma */}
          <div>
            <p style={{
              margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Representacion social
            </p>
            <div style={{
              padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, fontSize: 12, color: '#7f1d1d', lineHeight: 1.6,
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
                El estigma de Amozoc
              </p>
              <p style={{ margin: 0 }}>
                La percepcion generalizada presenta a Amozoc como un territorio "perdido",
                un municipio sin salvacion donde la violencia ha normalizado la desaparicion
                de personas. Este estigma territorial impacta directamente en la respuesta
                institucional y en la busqueda de justicia para las victimas.
              </p>
            </div>
          </div>

          {/* Contexto social */}
          <div>
            <p style={{
              margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Contexto social de la zona
            </p>
            <div style={{
              padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 8, fontSize: 12, color: '#374151', lineHeight: 1.6,
            }}>
              <p style={{ margin: 0 }}>
                Amozoc se ubica en la zona metropolitana de Puebla, en el cruce de
                las carreteras que conectan con Veracruz y Oaxaca. Su posicion
                estrategica lo convierte en un punto de disputa territorial entre
                distintos grupos del crimen organizado, facilitando el trasiego de
                mercancias robadas, combustible ilicito y la operacion de redes de
                trata de personas.
              </p>
            </div>
          </div>

          {/* Escalamiento de violencia */}
          <div>
            <p style={{
              margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Escalamiento de la violencia
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { year: '2015-2017', label: 'Inicio de disputas territoriales', level: 25 },
                { year: '2018-2019', label: 'Incremento de desapariciones', level: 50 },
                { year: '2020-2021', label: 'Consolidacion del control territorial', level: 75 },
                { year: '2022-presente', label: 'Violencia normalizada', level: 95 },
              ].map(({ year, label, level }) => (
                <div key={year} style={{ fontSize: 11, color: '#374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{year}</span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{level}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${level}%`, height: '100%', borderRadius: 3,
                      background: level > 70
                        ? 'linear-gradient(90deg, #dc2626, #991b1b)'
                        : level > 40
                          ? 'linear-gradient(90deg, #f59e0b, #dc2626)'
                          : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#6b7280' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Estadisticas clave */}
          <div>
            <p style={{
              margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Casos en desaparicion
            </p>
            <div style={{
              padding: '14px', background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>
                --.--%
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#7f1d1d' }}>
                de los casos registrados siguen<br />en calidad de desaparicion
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{
                flex: 1, padding: '10px 8px', background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 8, textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>--</div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Casos totales</div>
              </div>
              <div style={{
                flex: 1, padding: '10px 8px', background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 8, textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>--</div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Localizados</div>
              </div>
            </div>
          </div>

          {/* Nota wireframe */}
          <div style={{
            padding: '10px 12px', background: '#fffbeb', border: '1px dashed #fbbf24',
            borderRadius: 8, fontSize: 10, color: '#92400e', lineHeight: 1.5,
          }}>
            <strong>Wireframe:</strong> Los datos numericos y porcentajes seran
            reemplazados con cifras reales una vez disponibles.
          </div>
        </div>

        {/* Back button footer */}
        <div style={{
          flexShrink: 0, padding: '12px 18px', borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}>
          <button
            onClick={onExit}
            style={{
              width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600,
              color: '#374151', background: 'white', border: '1px solid #d1d5db',
              borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Volver al mapa
          </button>
        </div>
      </div>
    </>
  );
}
