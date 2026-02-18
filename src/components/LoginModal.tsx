import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Error desconocido');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Acceso LAF</h2>
              <p className="text-red-200 text-xs mt-0.5">Laboratorio de Arquitectura Forense</p>
            </div>
            <button
              onClick={onClose}
              className="text-red-200 hover:text-white transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm"
              placeholder="Ingresa tu usuario"
              autoFocus
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm"
              placeholder="Ingresa tu contraseña"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Iniciando sesión...
              </span>
            ) : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400 text-center">
            Solo personal autorizado del laboratorio
          </p>
        </div>
      </div>
    </div>
  );
}
