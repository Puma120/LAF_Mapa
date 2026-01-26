import { ScatterplotLayer, PolygonLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { FosaRecord } from '../hooks/useFosasData';

// Algoritmo de Convex Hull (Gift Wrapping / Jarvis March)
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;

  // Encontrar el punto más a la izquierda
  let leftmost = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] < points[leftmost][0]) leftmost = i;
  }

  const hull: [number, number][] = [];
  let p = leftmost;
  let q: number;

  do {
    hull.push(points[p]);
    q = (p + 1) % points.length;

    for (let i = 0; i < points.length; i++) {
      if (orientation(points[p], points[i], points[q]) === 2) {
        q = i;
      }
    }

    p = q;
  } while (p !== leftmost);

  return hull;
}

// Calcula la orientación de tres puntos (p, q, r)
// Retorna: 0 -> colineales, 1 -> sentido horario, 2 -> antihorario
function orientation(p: [number, number], q: [number, number], r: [number, number]): number {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (Math.abs(val) < 1e-10) return 0;
  return val > 0 ? 1 : 2;
}

// Colores por modalidad (paleta distintiva y vibrante)
export const MODALIDAD_COLORS: Record<string, [number, number, number, number]> = {
  'PRIMARIA': [231, 76, 60, 160],       // Rojo vibrante
  'SECUNDARIA': [52, 152, 219, 160],    // Azul brillante
  'TERCIARIA': [46, 204, 113, 160],     // Verde esmeralda
  'CUATERNARIA': [241, 196, 15, 160],   // Amarillo dorado
  'MÚLTIPLE': [155, 89, 182, 160],      // Púrpura
  'INDIVIDUAL': [230, 126, 34, 160],    // Naranja
  'COLECTIVA': [26, 188, 156, 160],     // Turquesa
  'POZO PARA RIEGO': [49, 130, 206, 160], // Azul consistente con el círculo
  'DEFAULT': [149, 165, 166, 140],      // Gris azulado
};

// Función para obtener modalidades únicas de las fosas filtradas
export function getModalidadesWithColors(fosas: FosaRecord[]): Array<{
  modalidad: string;
  color: [number, number, number, number];
  count: number;
}> {
  const modalidadCounts = new Map<string, number>();

  fosas.forEach(fosa => {
    const modalidad = (
      fosa.raw?.['MODALIDAD DE FOSA'] ||
      fosa.raw?.['MODALIDAD'] ||
      'SIN MODALIDAD'
    ).toString().trim().toUpperCase();

    modalidadCounts.set(modalidad, (modalidadCounts.get(modalidad) || 0) + 1);
  });

  const result: Array<{
    modalidad: string;
    color: [number, number, number, number];
    count: number;
  }> = [];

  modalidadCounts.forEach((count, modalidad) => {
    let color = MODALIDAD_COLORS['DEFAULT'];
    for (const [key, value] of Object.entries(MODALIDAD_COLORS)) {
      if (modalidad.includes(key)) {
        color = value;
        break;
      }
    }

    result.push({ modalidad, color, count });
  });

  return result.sort((a, b) => b.count - a.count);
}

export function createModalidadPolygons(fosas: FosaRecord[]): Layer | null {
  if (fosas.length < 3) return null;

  // Agrupar fosas por modalidad
  const groupedByModalidad = new Map<string, [number, number][]>();

  fosas.forEach(fosa => {
    const modalidad = (
      fosa.raw?.['MODALIDAD DE FOSA'] ||
      fosa.raw?.['MODALIDAD'] ||
      'SIN MODALIDAD'
    ).toString().trim().toUpperCase();

    if (!groupedByModalidad.has(modalidad)) {
      groupedByModalidad.set(modalidad, []);
    }
    groupedByModalidad.get(modalidad)!.push(fosa.position);
  });

  // Crear polígonos convexos para cada modalidad
  const polygons: Array<{
    polygon: [number, number][];
    color: [number, number, number, number];
    modalidad: string;
  }> = [];

  groupedByModalidad.forEach((points, modalidad) => {
    if (points.length >= 3) {
      const hull = convexHull(points);
      // Buscar color por palabras clave en la modalidad
      let color = MODALIDAD_COLORS['DEFAULT'];
      for (const [key, value] of Object.entries(MODALIDAD_COLORS)) {
        if (modalidad.includes(key)) {
          color = value;
          break;
        }
      }

      polygons.push({
        polygon: hull,
        color,
        modalidad,
      });
    }
  });

  if (polygons.length === 0) return null;

  return new PolygonLayer({
    id: 'modalidad-polygons',
    data: polygons,
    getPolygon: (d) => d.polygon,
    getFillColor: (d) => d.color,
    getLineColor: (d) => [d.color[0], d.color[1], d.color[2], 220],
    getLineWidth: 3,
    lineWidthMinPixels: 2,
    pickable: false,
    stroked: true,
    filled: true,
    extruded: false,
  });
}

export function createFosasLayer(fosas: FosaRecord[]): Layer {
  return new ScatterplotLayer<FosaRecord>({
    id: 'fosas-circle-layer',
    data: fosas,
    getPosition: (d) => d.position,
    getFillColor: [255, 0, 0, 220],
    radiusMinPixels: 6,
    stroked: true,
    getLineColor: [255, 255, 255, 255],
    lineWidthMinPixels: 1.2,
    pickable: true,
    visible: fosas.length > 0,
  });
}

// Círculo geodésico alrededor de un centro (lon, lat) con radio en metros
function makeGeodesicCircle([lon, lat]: [number, number], radiusMeters: number, segments = 64): [number, number][] {
  const R = 6378137; // Radio de la Tierra en metros (WGS84)
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;
  const δ = radiusMeters / R;

  const ring: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const θ = (2 * Math.PI * i) / segments; // 0..2π
    const sinφ1 = Math.sin(φ1);
    const cosφ1 = Math.cos(φ1);
    const sinδ = Math.sin(δ);
    const cosδ = Math.cos(δ);
    const sinθ = Math.sin(θ);
    const cosθ = Math.cos(θ);

    const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ;
    const φ2 = Math.asin(sinφ2);
    const y = sinθ * sinδ * cosφ1;
    const x = cosδ - sinφ1 * sinφ2;
    const λ2 = λ1 + Math.atan2(y, x);

    const lat2 = (φ2 * 180) / Math.PI;
    const lon2 = ((λ2 * 180) / Math.PI + 540) % 360 - 180; // normalizar a [-180, 180]
    ring.push([lon2, lat2]);
  }
  return ring;
}

// Crea un layer con un círculo para la modalidad "Pozo para riego"
export function createPozoCircleLayer(fosas: FosaRecord[], options?: { radiusMeters?: number; color?: [number, number, number, number]; }): Layer | null {
  if (!fosas.length) return null;

  // Buscar centro en municipio "San Salvador Huixcolotla" si existe
  const findMunicipio = (f: FosaRecord) => {
    const r = f.raw || {} as Record<string, any>;
    const v = (r['MUNICIPIO'] ?? r['MUNUCUPIO'] ?? r['Municipio'] ?? r['municipio'] ?? '').toString().trim().toUpperCase();
    return v;
  };

  const target = fosas.find(f => findMunicipio(f) === 'SAN SALVADOR HUIXCOLOTLA') || fosas[0];
  const center = target.position; // [lon, lat]

  const radiusMeters = options?.radiusMeters ?? 50000; // 50 km por defecto
  const color = options?.color ?? [49, 130, 206, 120]; // azul translúcido

  const circle = makeGeodesicCircle(center, radiusMeters, 96);

  return new PolygonLayer({
    id: 'pozo-circle-layer',
    data: [{ polygon: circle }],
    getPolygon: (d) => d.polygon,
    getFillColor: color,
    getLineColor: [49, 130, 206, 220],
    getLineWidth: 3,
    lineWidthMinPixels: 2,
    pickable: false,
    stroked: true,
    filled: true,
    extruded: false,
  });
}
