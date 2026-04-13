import { GeoJsonLayer } from '@deck.gl/layers';

export interface CorredorLineConfig {
  id: string;
  url: string;          // URL al GeoJSON con la línea del corredor
  color?: [number, number, number, number];
  width?: number;
}

/**
 * Carga un archivo GeoJSON con LineString y crea una capa de línea para el corredor.
 * Editar el archivo GeoJSON en /public/corredores/ para ajustar las coordenadas exactas.
 */
export function createCorredorLineLayer(
  config: CorredorLineConfig,
  data: any,
  visible: boolean = true,
) {
  if (!data) return null;

  const color = config.color ?? [220, 53, 69, 220];

  return new GeoJsonLayer({
    id: `corredor-line-${config.id}`,
    data,
    filled: false,
    stroked: true,
    pickable: false,
    visible,
    getLineColor: color,
    getLineWidth: config.width ?? 3,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 2,
    lineWidthMaxPixels: 6,
    lineJointRounded: true,
    lineCapRounded: true,
    parameters: { depthTest: false } as any,
  });
}

// Configuraciones de líneas de corredor disponibles
export const CORREDOR_LINES: CorredorLineConfig[] = [
  {
    id: 'centro-oriente',
    url: '/corredores/centro-oriente.json',
    color: [220, 53, 69, 220],
    width: 3,
  },
];
