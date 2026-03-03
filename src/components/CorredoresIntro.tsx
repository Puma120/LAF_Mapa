import logoIbero from '../assets/Logo-Ibero.png';
import logoLAF from '../assets/Logo-LAF-Negro.png';

interface CorredoresIntroProps {
  onEnterMap: () => void;
}

export default function CorredoresIntro({ onEnterMap }: CorredoresIntroProps) {
  return (
    <div className="fixed inset-0 z-[9000] flex pointer-events-none">
      {/* Left half — transparent so the map behind is visible */}
      <div className="w-1/2 h-full flex-shrink-0" />

      {/* Right panel — white, scrollable */}
      <div
        className="w-1/2 h-full bg-white flex flex-col pointer-events-auto overflow-hidden"
        style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-end gap-4 px-8 py-5 border-b border-gray-100">
          <img src={logoIbero} alt="IBERO Puebla" className="h-10 object-contain" />
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right leading-tight">
            <p className="text-[11px] font-semibold text-gray-800 uppercase tracking-wide">
              Laboratorio de
            </p>
            <p className="text-[11px] font-semibold text-gray-800 uppercase tracking-wide">
              Arquitectura Forense
            </p>
          </div>
          <img src={logoLAF} alt="LAF" className="h-10 object-contain" />
        </header>

        {/* Scrollable article content */}
        <div className="flex-1 overflow-y-auto px-12 py-10 space-y-5">
          <h1
            className="text-[1.6rem] font-bold text-gray-900 leading-snug"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Corredores socioterritoriales<br />
            de la Violencia en Puebla
          </h1>

          <p className="text-[0.875rem] text-gray-700 leading-relaxed">
            Para definir los corredores en Puebla, se partió de la idea de que
            estos no son simples zonas geográficas, sino{' '}
            <strong>expresiones territoriales</strong> de un{' '}
            <strong>dispositivo de poder</strong> que articula múltiples elementos
            —<em>espaciales, normativos, institucionales, económicos y delictivos</em>—
            con el objetivo de controlar el territorio para la extracción de recursos.
          </p>

          <p className="text-[0.875rem] text-gray-700 leading-relaxed">
            En esta perspectiva, el poder no es algo que se posee, sino algo que se
            ejerce a través de relaciones dinámicas y configuraciones cambiantes.
          </p>

          <p className="text-[0.875rem] text-gray-700 leading-relaxed">
            Así, los corredores se identifican como formas específicas en que se
            materializa un{' '}
            <strong className="text-red-600">dispositivo criminal</strong>, cuyo objetivo
            no es la desaparición en sí misma, sino{' '}
            <strong className="text-red-600">la apropiación de recursos</strong> como
            gasolina, mercancías, dinero, cuerpos (trata de personas), entre otros.
          </p>

          <p className="text-[0.875rem] text-gray-700 leading-relaxed">
            La desaparición opera como una función dentro de ese entramado mayor, que es
            el de la macrocriminalidad.
          </p>

          <p className="text-[0.875rem] text-gray-700 leading-relaxed">
            Estos corredores, por tanto, no se delimitan únicamente por criterios
            administrativos o estadísticos, sino por la presencia y articulación de
            actores y prácticas concretas —<em>como cárteles, empresas, policías,
            autoridades locales, etc.</em>— y por los efectos diferenciados que estas
            dinámicas generan sobre ciertos cuerpos y poblaciones.
          </p>

          <p className="text-[0.875rem] text-gray-700 leading-relaxed">
            La caracterización de los corredores, entonces, se basa en{' '}
            <strong>
              identificar las lógicas de poder en disputa, los recursos en juego y los
              perfiles de víctimas afectados
            </strong>
            , permitiendo observar cómo la violencia se convierte en una forma de gestión
            territorial y control social.
          </p>

          {/* CTA button */}
          <div className="pt-4 pb-2">
            <button
              onClick={onEnterMap}
              className="group inline-flex items-center gap-2 px-7 py-3 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-md shadow-red-900/25 transition-all duration-200 hover:shadow-red-700/35 hover:scale-[1.02] active:scale-[0.98]"
            >
              Explorar el mapa interactivo
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
