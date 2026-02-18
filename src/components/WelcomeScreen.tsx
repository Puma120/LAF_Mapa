import logoLAF from '../assets/Logo-LAF-Blanco.png';
import logoIbero from '../assets/Logo-Ibero.png';

interface WelcomeScreenProps {
  onEnter: () => void;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-gray-950">
      {/* Fondo con patrón sutil */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradiente decorativo superior */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-700 to-transparent" />

      {/* Líneas decorativas laterales */}
      <div className="absolute left-12 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-red-800/30 to-transparent hidden md:block" />
      <div className="absolute right-12 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-red-800/30 to-transparent hidden md:block" />

      {/* Contenido principal */}
      <div className="relative flex flex-col items-center gap-8 px-6 max-w-2xl text-center animate-fade-in">
        {/* Logos */}
        <div className="flex items-center gap-8 mb-2">
          <img src={logoLAF} alt="LAF" className="h-24 md:h-32 drop-shadow-lg" />
          <div className="w-px h-16 bg-white/20" />
          <img src={logoIbero} alt="IBERO Puebla" className="h-16 md:h-20 drop-shadow-lg" />
        </div>

        {/* Título */}
        <div className="space-y-3">
          <h1 className="text-white text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Laboratorio de
            <br />
            <span className="text-red-500">Arquitectura Forense</span>
          </h1>
          <div className="w-16 h-0.5 bg-red-700 mx-auto" />
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Plataforma de visualización geoespacial para el análisis
            de fosas clandestinas, desapariciones y violencia en Puebla, México.
          </p>
        </div>

        {/* Botón de entrada */}
        <button
          onClick={onEnter}
          className="group mt-4 px-8 py-3 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg shadow-lg shadow-red-900/30 transition-all duration-300 hover:shadow-red-800/40 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          Explorar el Mapa
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 transition-transform group-hover:translate-x-1"
          >
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Créditos */}
        <p className="text-gray-600 text-xs mt-6">
          IBERO Puebla · Universidad Iberoamericana
        </p>
      </div>

      {/* Gradiente decorativo inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-700 to-transparent" />
    </div>
  );
}
