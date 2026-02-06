import { useState } from 'react';
import type { ShapeConfig } from '../hooks/useShapefileLoader';

interface LayerSelectorProps {
  layers: ShapeConfig[];
  activeLayers: string[];
  onToggleLayer: (layerId: string) => void;
  loadingLayers: string[];
}

export default function LayerSelector({ 
  layers, 
  activeLayers, 
  onToggleLayer,
  loadingLayers 
}: LayerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-[140px] left-4 z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600">
          <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742zM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/>
        </svg>
        Capas de Polígonos
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[250px] overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-700">Seleccionar Capas</h3>
          </div>
          <div className="p-2">
            {layers.map((layer) => {
              const isActive = activeLayers.includes(layer.id);
              const isLoading = loadingLayers.includes(layer.id);
              
              return (
                <label
                  key={layer.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onToggleLayer(layer.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{
                          backgroundColor: layer.color 
                            ? `rgba(${layer.color[0]}, ${layer.color[1]}, ${layer.color[2]}, ${layer.color[3] / 255})`
                            : 'rgba(65, 105, 225, 0.3)',
                          borderColor: layer.strokeColor 
                            ? `rgba(${layer.strokeColor[0]}, ${layer.strokeColor[1]}, ${layer.strokeColor[2]}, 0.8)`
                            : 'rgba(65, 105, 225, 0.8)',
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700">{layer.name}</span>
                    </div>
                  </div>
                  {isLoading && (
                    <svg className="w-4 h-4 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </label>
              );
            })}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Click en un polígono para ver información
          </div>
        </div>
      )}
    </div>
  );
}
