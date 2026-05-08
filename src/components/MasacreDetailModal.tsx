import { useEffect } from 'react';
import type { MasacreRecord } from '../hooks/useMasacresData';

type Props = {
  feature: MasacreRecord;
  onClose: () => void;
};

const getValue = (row: Record<string, any>, keys: string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
};

const extractLinks = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s)]+/g;
  return Array.from(new Set(text.match(urlRegex) ?? []));
};

export default function MasacreDetailModal({ feature, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [onClose]);

  const r = feature.raw || {};
  const fecha      = getValue(r, ['fecha', 'Fecha', 'FECHA']);
  const anio       = getValue(r, ['año', 'Año', 'ANO', 'AÑO']);
  const municipio  = getValue(r, ['Municipio', 'MUNICIPIO', 'municipio']);
  const numero     = getValue(r, ['Número', 'Numero', 'NÚMERO']);
  const descripcion = getValue(r, ['Descripción resumida', 'DESCRIPCIÓN', 'Descripcion', 'DESCRIPCION']);
  const linksRaw   = getValue(r, ['Links', 'LINKS', 'Link', 'LINK']);
  const urls       = linksRaw ? extractLinks(linksRaw) : [];

  const fields: { label: string; value: string }[] = [
    { label: 'Fecha',      value: fecha },
    { label: 'Año',        value: anio },
    { label: 'Municipio',  value: municipio },
    { label: 'N.º caso',   value: numero },
  ].filter(f => f.value);

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-purple-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6 flex-shrink-0">
              <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-0.5">Masacre</p>
              <h2 className="text-white font-bold text-lg leading-tight m-0">
                {municipio ? municipio : 'Detalle del registro'}
                {numero ? <span className="text-purple-300 font-normal text-sm ml-2">#{numero}</span> : null}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-white/70 hover:text-white rounded-full p-1 transition-colors duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-gray-700">

          {/* Grid de campos */}
          {fields.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Información general</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {fields.map(({ label, value }) => (
                  <div key={label} className="flex flex-col">
                    <dt className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{label}</dt>
                    <dd className="text-gray-800 font-medium leading-snug">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Descripción */}
          {descripcion && (
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Descripción</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 leading-relaxed text-gray-700 text-justify whitespace-pre-line">
                {descripcion}
              </div>
            </section>
          )}

          {/* Fuentes */}
          {urls.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Fuentes y enlaces</h3>
              <ul className="space-y-2">
                {urls.map((url, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0">
                      <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                      <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                    </svg>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 hover:text-purple-900 hover:underline break-all transition-colors duration-150"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Coordenadas */}
          <section className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Coordenadas</h3>
            <p className="text-gray-600 font-mono text-xs bg-gray-50 rounded-lg px-3 py-2 inline-block">
              {feature.position[1].toFixed(6)}, {feature.position[0].toFixed(6)}
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 flex justify-end bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 transition-colors duration-150"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
