import { GeoJsonLayer } from '@deck.gl/layers';
import type { ShapeFeature, ShapeConfig } from '../hooks/useShapefileLoader';
import type { Feature, Geometry, GeoJsonProperties, FeatureCollection } from 'geojson';

// Paleta de colores para las capas
const LAYER_COLORS: Record<string, [number, number, number, number][]> = {
  municipios: [
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
  ],
  desaparecidos: [
    [220, 53, 69, 100],   // Rojo para desaparecidos
  ],
};

function getColorByIndex(layerId: string, index: number): [number, number, number, number] {
  const colors = LAYER_COLORS[layerId] || LAYER_COLORS.municipios;
  return colors[index % colors.length];
}

function getBorderColor(fillColor: [number, number, number, number]): [number, number, number, number] {
  return [fillColor[0], fillColor[1], fillColor[2], 200];
}

// Función para calcular el total de desapariciones según el rango de años
function calcularDesapariciones(properties: Record<string, any>, yearRange: [number, number] | null): number {
  if (!yearRange) return 0;
  
  const [minYear, maxYear] = yearRange;
  let total = 0;
  
  // Los campos DPFGE_ contienen datos de desapariciones por año
  // Formato esperado: DPFGE_2014, DPFGE_2015, etc.
  for (let year = minYear; year <= maxYear; year++) {
    const fieldName = `DPFGE_${year}`;
    const value = properties[fieldName];
    if (value != null && !isNaN(Number(value))) {
      total += Number(value);
    }
  }
  
  return total;
}

// Función para obtener color basado en intensidad de desapariciones
function getColorByIntensity(
  baseColor: [number, number, number, number],
  desapariciones: number,
  maxDesapariciones: number
): [number, number, number, number] {
  if (maxDesapariciones === 0 || desapariciones === 0) {
    // Sin datos: color muy tenue
    return [baseColor[0], baseColor[1], baseColor[2], 20];
  }
  
  // Normalizar entre 0 y 1
  const ratio = desapariciones / maxDesapariciones;
  
  // Usar escala exponencial para hacer más dramática la diferencia
  // Los valores bajos serán más claros, los altos mucho más oscuros
  const intensity = Math.pow(ratio, 0.5); // Raíz cuadrada para expandir diferencias
  
  // Alpha va de 30 (mínimo) a 240 (máximo)
  const alpha = Math.round(30 + intensity * 210);
  
  // También oscurecemos el color base para valores altos
  const darkenFactor = 1 - (intensity * 0.4); // Reduce hasta 60% del brillo original
  const r = Math.round(baseColor[0] * darkenFactor);
  const g = Math.round(baseColor[1] * darkenFactor);
  const b = Math.round(baseColor[2] * darkenFactor);
  
  return [r, g, b, alpha];
}

export interface ShapeLayerOptions {
  visible?: boolean;
  pickable?: boolean;
  highlightColor?: [number, number, number, number];
  onClick?: (info: any) => void;
  /** Rango de años para calcular intensidad del color basado en campos DPFGE_ */
  yearRange?: [number, number] | null;
}

export function createShapeLayer(
  layerId: string,
  features: ShapeFeature[],
  config: ShapeConfig,
  options: ShapeLayerOptions = {}
) {
  const {
    visible = true,
    pickable = true,
    highlightColor = [255, 255, 100, 150],
    onClick,
    yearRange = null,
  } = options;

  // Convertir los features a un formato GeoJSON completo
  const geoFeatures: Feature<Geometry, GeoJsonProperties>[] = features.map((feature, index) => ({
    type: 'Feature' as const,
    geometry: feature.geometry as Geometry,
    properties: {
      ...feature.properties,
      _index: index,
      _layerId: layerId,
      _layerName: config.name,
    },
  }));

  const geojsonData: FeatureCollection<Geometry, GeoJsonProperties> = {
    type: 'FeatureCollection',
    features: geoFeatures,
  };

  // Determinar si es una capa de un solo color o multicolor
  const isSingleColor = config.color != null;
  const baseColor = config.color || [65, 105, 225, 80];
  const baseStroke = config.strokeColor || getBorderColor(baseColor as [number, number, number, number]);

  // Si es la capa del corredor y hay yearRange, calcular el máximo de desapariciones
  let maxDesapariciones = 0;
  const useIntensity = layerId === 'corredor' && yearRange != null;
  
  if (useIntensity) {
    for (const feature of features) {
      const total = calcularDesapariciones(feature.properties || {}, yearRange);
      if (total > maxDesapariciones) {
        maxDesapariciones = total;
      }
    }
  }

  return new GeoJsonLayer({
    id: `shape-layer-${layerId}`,
    data: geojsonData,
    filled: true,
    stroked: true,
    pickable,
    visible,
    autoHighlight: true,
    highlightColor,
    // Forzar actualización cuando cambia yearRange
    updateTriggers: {
      getFillColor: [yearRange],
      getLineColor: [yearRange],
    },
    getFillColor: (feature: Feature<Geometry, GeoJsonProperties>) => {
      // Si es capa del corredor con yearRange, usar intensidad por desapariciones
      if (useIntensity && feature.properties) {
        const desapariciones = calcularDesapariciones(feature.properties, yearRange);
        return getColorByIntensity(
          baseColor as [number, number, number, number],
          desapariciones,
          maxDesapariciones
        );
      }
      
      if (isSingleColor) {
        return baseColor as [number, number, number, number];
      }
      const index = feature.properties?._index ?? 0;
      return getColorByIndex(layerId, index);
    },
    getLineColor: (feature: Feature<Geometry, GeoJsonProperties>) => {
      // Si es capa del corredor con yearRange, usar intensidad por desapariciones
      if (useIntensity && feature.properties) {
        const desapariciones = calcularDesapariciones(feature.properties, yearRange);
        const fillColor = getColorByIntensity(
          baseColor as [number, number, number, number],
          desapariciones,
          maxDesapariciones
        );
        return getBorderColor(fillColor);
      }
      
      if (isSingleColor) {
        return baseStroke as [number, number, number, number];
      }
      const index = feature.properties?._index ?? 0;
      const fillColor = getColorByIndex(layerId, index);
      return getBorderColor(fillColor);
    },
    getLineWidth: 2,
    lineWidthMinPixels: 1,
    extruded: false,
    onClick,
  });
}
