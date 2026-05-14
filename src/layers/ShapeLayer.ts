import { GeoJsonLayer } from '@deck.gl/layers';
import type { ShapeFeature, ShapeConfig } from '../hooks/useShapefileLoader';
import type { Feature, Geometry, GeoJsonProperties, FeatureCollection } from 'geojson';

// ─── GeoJSON cache ────────────────────────────────────────────────────────────
// Keyed by the same `features` array reference — avoids re-triangulation on the
// GPU when only yearRange/colors change (geometry never changes).
const geoJsonCache = new WeakMap<ShapeFeature[], FeatureCollection<Geometry, GeoJsonProperties>>();

function getOrBuildFeatureCollection(
  features: ShapeFeature[],
  layerId: string,
  isSingleColor: boolean,
  baseColor: [number, number, number, number],
): FeatureCollection<Geometry, GeoJsonProperties> {
  if (geoJsonCache.has(features)) return geoJsonCache.get(features)!;

  const geoFeatures: Feature<Geometry, GeoJsonProperties>[] = features.map((f, index) => {
    const fill = isSingleColor ? baseColor : getColorByIndex(layerId, index);
    const stroke = getBorderColor(fill);
    return {
      type: 'Feature' as const,
      geometry: f.geometry as Geometry,
      properties: {
        ...f.properties,
        _index: index,
        _layerId: layerId,
        // Pre-baked static colors (avoids per-frame accessor overhead for non-intensity layers)
        _fc: fill,   // fillColor
        _lc: stroke, // lineColor
      },
    };
  });

  const collection: FeatureCollection<Geometry, GeoJsonProperties> = {
    type: 'FeatureCollection',
    features: geoFeatures,
  };
  geoJsonCache.set(features, collection);
  return collection;
}

// Stable module-level accessor functions — deck.gl checks accessor identity; using
// closures created inside createShapeLayer forces a full attribute rebuild every call.
const GET_FILL_STATIC = (f: Feature<Geometry, GeoJsonProperties>) =>
  (f.properties?._fc ?? [65, 105, 225, 80]) as [number, number, number, number];

const GET_LINE_STATIC = (f: Feature<Geometry, GeoJsonProperties>) =>
  (f.properties?._lc ?? [65, 105, 225, 200]) as [number, number, number, number];

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
  // Dark border for maximum contrast regardless of fill color
  return [20, 20, 20, 200];
}

// Función para calcular el total de desapariciones según el rango de años
function calcularDesapariciones(properties: Record<string, any>, yearRange: [number, number] | null, prefix: string = 'DPFGE_'): number {
  if (!yearRange) return 0;
  
  const [minYear, maxYear] = yearRange;
  let total = 0;
  
  for (let year = minYear; year <= maxYear; year++) {
    const fieldName = `${prefix}${year}`;
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

  const isSingleColor = config.color != null;
  const baseColor = (config.color || [65, 105, 225, 80]) as [number, number, number, number];
  const baseStroke = (config.strokeColor || getBorderColor(baseColor)) as [number, number, number, number];

  // ── Use cached GeoJSON so deck.gl never re-triangulates unchanged geometry ──
  const geojsonData = getOrBuildFeatureCollection(features, layerId, isSingleColor, baseColor);

  // ── Intensity layers (desapariciones and delito layers use data coloring) ──
  const isDelitoLayer = layerId.startsWith('delito_');
  const isDesapCorredor = layerId === 'desapariciones_corredor';
  const useIntensity = (layerId === 'desapariciones' || isDelitoLayer || isDesapCorredor) && yearRange != null;
  const intensityPrefix = isDelitoLayer ? '_DELITO_TASA_' : isDesapCorredor ? 'DPFGE_' : '_DESAP_TOTAL_';

  let maxValue = 0;
  if (useIntensity) {
    for (const f of features) {
      const total = calcularDesapariciones(f.properties || {}, yearRange, intensityPrefix);
      if (total > maxValue) maxValue = total;
    }
  }

  // For intensity layers the colors change with yearRange but geometry never does.
  // We use updateTriggers so deck.gl only re-uploads the color attribute, not the
  // vertex buffers.
  const fillAccessor = useIntensity
    ? (feature: Feature<Geometry, GeoJsonProperties>) => {
        if (!feature.properties) return baseColor;
        return getColorByIntensity(
          baseColor,
          calcularDesapariciones(feature.properties, yearRange, intensityPrefix),
          maxValue,
        );
      }
    : GET_FILL_STATIC;  // stable reference — no attribute rebuild on re-render

  const lineAccessor = useIntensity
    ? (feature: Feature<Geometry, GeoJsonProperties>) => {
        if (!feature.properties) return baseStroke;
        const fc = getColorByIntensity(
          baseColor,
          calcularDesapariciones(feature.properties, yearRange, intensityPrefix),
          maxValue,
        );
        return getBorderColor(fc);
      }
    : GET_LINE_STATIC;

  return new GeoJsonLayer({
    id: `shape-layer-${layerId}`,
    data: geojsonData,
    filled: true,
    stroked: true,
    pickable,
    visible,
    autoHighlight: true,
    highlightColor,
    // deck.gl only re-uploads color buffers when these change — geometry is untouched
    updateTriggers: {
      getFillColor: useIntensity ? [yearRange] : [],
      getLineColor: useIntensity ? [yearRange] : [],
    },
    getFillColor: fillAccessor,
    getLineColor: lineAccessor,
    getLineWidth: 1,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1.5,
    lineWidthMaxPixels: 3,
    extruded: false,
    // 2D only — skip depth testing (cheaper render pass)
    parameters: { depthTest: false } as any,    onClick,
  });
}