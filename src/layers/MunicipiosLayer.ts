import { GeoJsonLayer } from '@deck.gl/layers';
import type { MunicipioFeature } from '../hooks/useMunicipiosShape';
import type { Feature, Geometry, GeoJsonProperties, FeatureCollection } from 'geojson';

// Paleta de colores para los municipios (colores distintivos y semi-transparentes)
const MUNICIPIO_COLORS: [number, number, number, number][] = [
  [65, 105, 225, 80],   // Royal Blue
  [50, 205, 50, 80],    // Lime Green
  [255, 165, 0, 80],    // Orange
  [138, 43, 226, 80],   // Blue Violet
  [255, 99, 71, 80],    // Tomato
  [0, 206, 209, 80],    // Dark Turquoise
  [255, 215, 0, 80],    // Gold
  [199, 21, 133, 80],   // Medium Violet Red
  [0, 191, 255, 80],    // Deep Sky Blue
  [154, 205, 50, 80],   // Yellow Green
  [255, 20, 147, 80],   // Deep Pink
  [64, 224, 208, 80],   // Turquoise
  [255, 140, 0, 80],    // Dark Orange
  [186, 85, 211, 80],   // Medium Orchid
  [60, 179, 113, 80],   // Medium Sea Green
];

// Función para obtener un color basado en el índice
function getColorByIndex(index: number): [number, number, number, number] {
  return MUNICIPIO_COLORS[index % MUNICIPIO_COLORS.length];
}

// Función para obtener un color más intenso para el borde
function getBorderColor(fillColor: [number, number, number, number]): [number, number, number, number] {
  return [fillColor[0], fillColor[1], fillColor[2], 200];
}

export interface MunicipioLayerOptions {
  visible?: boolean;
  opacity?: number;
  filled?: boolean;
  stroked?: boolean;
  lineWidthMinPixels?: number;
  pickable?: boolean;
  highlightColor?: [number, number, number, number];
  onClick?: (info: any) => void;
}

export function createMunicipiosLayer(
  municipios: MunicipioFeature[],
  options: MunicipioLayerOptions = {}
) {
  const {
    visible = true,
    filled = true,
    stroked = true,
    lineWidthMinPixels = 1,
    pickable = true,
    highlightColor = [255, 255, 0, 128],
    onClick,
  } = options;

  // Convertir los features a un formato GeoJSON completo
  const features: Feature<Geometry, GeoJsonProperties>[] = municipios.map((feature, index) => ({
    type: 'Feature' as const,
    geometry: feature.geometry as Geometry,
    properties: {
      ...feature.properties,
      _index: index, // Agregar índice para colorear
    },
  }));

  const geojsonData: FeatureCollection<Geometry, GeoJsonProperties> = {
    type: 'FeatureCollection',
    features,
  };

  return new GeoJsonLayer({
    id: 'municipios-puebla-layer',
    data: geojsonData,
    filled,
    stroked,
    pickable,
    visible,
    autoHighlight: true,
    highlightColor,
    getFillColor: (feature: Feature<Geometry, GeoJsonProperties>) => {
      const index = feature.properties?._index ?? 0;
      return getColorByIndex(index);
    },
    getLineColor: (feature: Feature<Geometry, GeoJsonProperties>) => {
      const index = feature.properties?._index ?? 0;
      const fillColor = getColorByIndex(index);
      return getBorderColor(fillColor);
    },
    getLineWidth: 2,
    lineWidthMinPixels,
    // Configuración de extrusión (opcional para 3D)
    extruded: false,
    onClick,
  });
}

// Layer simplificado que solo muestra los contornos
export function createMunicipiosOutlineLayer(
  municipios: MunicipioFeature[],
  options: { color?: [number, number, number, number]; lineWidth?: number } = {}
) {
  const { color = [100, 100, 100, 180], lineWidth = 2 } = options;

  const features: Feature<Geometry, GeoJsonProperties>[] = municipios.map((feature) => ({
    type: 'Feature' as const,
    geometry: feature.geometry as Geometry,
    properties: feature.properties,
  }));

  const geojsonData: FeatureCollection<Geometry, GeoJsonProperties> = {
    type: 'FeatureCollection',
    features,
  };

  return new GeoJsonLayer({
    id: 'municipios-outline-layer',
    data: geojsonData,
    filled: false,
    stroked: true,
    pickable: false,
    getLineColor: color,
    getLineWidth: lineWidth,
    lineWidthMinPixels: 1,
  });
}
