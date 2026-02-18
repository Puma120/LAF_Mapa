import { useState, useRef, type ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LAYER_CONFIGS } from '../hooks/useShapefileLoader';

/** Representa un CSV subido y asignado a una capa */
export interface UploadedCSV {
  id: string;
  fileName: string;
  layerId: string;
  /** Nombre de la capa nueva (si se creó una) */
  layerName?: string;
  records: number;
  fields: string[];
  data: Record<string, any>[];
  uploadedAt: Date;
}

interface AdminPanelProps {
  onClose: () => void;
  uploadedCSVs: UploadedCSV[];
  onCSVUpload: (csv: UploadedCSV) => void;
  onCSVRemove: (csvId: string) => void;
}

export default function AdminPanel({ onClose, uploadedCSVs, onCSVUpload, onCSVRemove }: AdminPanelProps) {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'csv' | 'settings'>('overview');
  const [csvPreview, setCsvPreview] = useState<{ fields: string[]; rows: Record<string, any>[]; fileName: string } | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('');
  const [newLayerName, setNewLayerName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Solo se permiten archivos CSV' });
      return;
    }
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setMessage({ type: 'error', text: 'El CSV debe tener al menos una fila de datos' });
        return;
      }

      // Parse simple CSV
      const parseRow = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') { inQuotes = !inQuotes; continue; }
          if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
          current += char;
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseRow(lines[0]);
      const rows: Record<string, any>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseRow(lines[i]);
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
        rows.push(row);
      }

      setCsvPreview({ fields: headers, rows, fileName: file.name });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleUpload = () => {
    if (!csvPreview) return;
    if (!selectedLayerId && !newLayerName.trim()) {
      setMessage({ type: 'error', text: 'Selecciona una capa existente o crea una nueva' });
      return;
    }

    setUploading(true);
    // Simular procesamiento
    setTimeout(() => {
      const targetLayerId = selectedLayerId || `custom_${Date.now()}`;
      const csv: UploadedCSV = {
        id: `csv_${Date.now()}`,
        fileName: csvPreview.fileName,
        layerId: targetLayerId,
        layerName: newLayerName.trim() || undefined,
        records: csvPreview.rows.length,
        fields: csvPreview.fields,
        data: csvPreview.rows,
        uploadedAt: new Date(),
      };
      onCSVUpload(csv);
      setCsvPreview(null);
      setSelectedLayerId('');
      setNewLayerName('');
      setUploading(false);
      setMessage({ type: 'success', text: `CSV "${csv.fileName}" cargado correctamente (${csv.records} registros)` });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 800);
  };

  const allLayers = [
    ...LAYER_CONFIGS.map(c => ({ id: c.id, name: c.name })),
  ];

  return (
    <div
      className="fixed inset-0 z-[9998] flex"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ml-auto w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
                </svg>
                Panel de Administración
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                {user?.displayName} · {user?.role}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl leading-none p-1"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {([
              { key: 'overview' as const, label: 'General' },
              { key: 'csv' as const, label: 'Datos CSV' },
              { key: 'settings' as const, label: 'Ajustes' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-800'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {message && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Tab: General */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Capas Configuradas</h3>
                <div className="space-y-2">
                  {LAYER_CONFIGS.map(config => (
                    <div key={config.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: config.color
                            ? `rgba(${config.color[0]}, ${config.color[1]}, ${config.color[2]}, 0.6)`
                            : 'rgba(65,105,225,0.6)',
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{config.name}</p>
                        <p className="text-xs text-gray-500">{config.basePath}/{config.fileName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">CSVs Cargados</h3>
                {uploadedCSVs.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No hay CSVs adicionales cargados</p>
                ) : (
                  <div className="space-y-2">
                    {uploadedCSVs.map(csv => (
                      <div key={csv.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600">
                          <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{csv.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {csv.records} registros · Capa: {csv.layerName || csv.layerId}
                          </p>
                        </div>
                        <button
                          onClick={() => onCSVRemove(csv.id)}
                          className="text-red-400 hover:text-red-600 transition-colors text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Acciones Rápidas</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab('csv')}
                    className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                  >
                    <p className="text-sm font-medium text-blue-800">Subir CSV</p>
                    <p className="text-xs text-blue-600">Agregar datos a capas</p>
                  </button>
                  <button
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <p className="text-sm font-medium text-gray-800">Gestionar Usuarios</p>
                    <p className="text-xs text-gray-500">Próximamente</p>
                  </button>
                  <button
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <p className="text-sm font-medium text-gray-800">Exportar Datos</p>
                    <p className="text-xs text-gray-500">Próximamente</p>
                  </button>
                  <button
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <p className="text-sm font-medium text-gray-800">Configurar Capas</p>
                    <p className="text-xs text-gray-500">Próximamente</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: CSV */}
          {activeTab === 'csv' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Subir archivo CSV</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Sube un archivo CSV para agregarlo a una capa existente o crear una capa nueva.
                  El CSV debe contener una columna con clave de municipio (CVEGEO) o nombre (NOMGEO) para asociar con los polígonos.
                </p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-400 mx-auto mb-2">
                    <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5Z" clipRule="evenodd" />
                    <path d="M3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" />
                  </svg>
                  <p className="text-sm text-gray-600">Click para seleccionar un archivo CSV</p>
                  <p className="text-xs text-gray-400 mt-1">o arrastra y suelta aquí</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Preview */}
              {csvPreview && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800">
                      📄 {csvPreview.fileName}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {csvPreview.rows.length} registros · {csvPreview.fields.length} campos
                    </p>
                  </div>

                  {/* Campos detectados */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Campos detectados:</h4>
                    <div className="flex flex-wrap gap-1">
                      {csvPreview.fields.map(f => (
                        <span key={f} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Vista previa de datos */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Vista previa (primeros 3 registros):</h4>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            {csvPreview.fields.slice(0, 6).map(f => (
                              <th key={f} className="px-2 py-1.5 text-left text-gray-600 font-medium border-b">
                                {f}
                              </th>
                            ))}
                            {csvPreview.fields.length > 6 && (
                              <th className="px-2 py-1.5 text-gray-400 border-b">...</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.rows.slice(0, 3).map((row, i) => (
                            <tr key={i} className="border-b last:border-b-0">
                              {csvPreview.fields.slice(0, 6).map(f => (
                                <td key={f} className="px-2 py-1.5 text-gray-700 max-w-[100px] truncate">
                                  {row[f]}
                                </td>
                              ))}
                              {csvPreview.fields.length > 6 && (
                                <td className="px-2 py-1.5 text-gray-400">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Asignar a capa */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">Asignar a capa</h4>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Capa existente:</label>
                      <select
                        value={selectedLayerId}
                        onChange={(e) => {
                          setSelectedLayerId(e.target.value);
                          if (e.target.value) setNewLayerName('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">— Seleccionar capa —</option>
                        {allLayers.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-300" />
                      <span className="text-xs text-gray-400">o</span>
                      <div className="flex-1 h-px bg-gray-300" />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Crear capa nueva:</label>
                      <input
                        type="text"
                        value={newLayerName}
                        onChange={(e) => {
                          setNewLayerName(e.target.value);
                          if (e.target.value) setSelectedLayerId('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Nombre de la nueva capa"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCsvPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading || (!selectedLayerId && !newLayerName.trim())}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {uploading ? 'Procesando...' : 'Subir y Asignar'}
                    </button>
                  </div>
                </div>
              )}

              {/* CSVs ya subidos */}
              {uploadedCSVs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Archivos cargados</h3>
                  <div className="space-y-2">
                    {uploadedCSVs.map(csv => (
                      <div key={csv.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{csv.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {csv.records} registros · {csv.fields.length} campos · Capa: {csv.layerName || csv.layerId}
                          </p>
                          <p className="text-xs text-gray-400">
                            Subido: {csv.uploadedAt.toLocaleString('es-MX')}
                          </p>
                        </div>
                        <button
                          onClick={() => onCSVRemove(csv.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium">🚧 En desarrollo</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Las funciones de configuración avanzada estarán disponibles cuando se implemente la base de datos.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Sesión Actual</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Usuario:</span>
                    <span className="text-gray-800 font-medium">{user?.username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Nombre:</span>
                    <span className="text-gray-800 font-medium">{user?.displayName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rol:</span>
                    <span className="text-gray-800 font-medium capitalize">{user?.role}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
