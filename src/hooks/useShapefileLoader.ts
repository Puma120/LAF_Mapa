import { useState, useEffect } from 'react';
import * as shapefile from 'shapefile';
import proj4 from 'proj4';

export interface ShapeFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon' | 'Point' | 'LineString' | 'MultiPoint' | 'MultiLineString';
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface ShapeConfig {
  id: string;
  name: string;
  basePath: string;
  fileName: string;
  color?: [number, number, number, number];
  strokeColor?: [number, number, number, number];
  /** Campo por el cual filtrar (ej: 'NOMGEO') */
  filterField?: string;
  /** Lista de valores permitidos para el campo de filtro */
  filterValues?: string[];
}

// Función para corregir encoding corrupto (UTF-8 mal interpretado como Latin-1)
function fixEncoding(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Mapa de reemplazos para caracteres corruptos comunes en español
  const replacements: [string, string][] = [
    ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'],
    ['Ã±', 'ñ'], ['Ã¼', 'ü'],
    ['Ã\x81', 'Á'], ['Ã‰', 'É'], ['Ã\x8D', 'Í'], ['Ã"', 'Ó'], ['Ãš', 'Ú'],
    ['Ã\x91', 'Ñ'], ['Ãœ', 'Ü'],
    ['Â°', '°'], ['Â¿', '¿'], ['Â¡', '¡'],
  ];
  
  let result = text;
  for (const [corrupted, correct] of replacements) {
    result = result.split(corrupted).join(correct);
  }
  
  return result;
}

// Función para corregir encoding en todas las propiedades de un feature
function fixFeatureProperties(properties: Record<string, any>): Record<string, any> {
  const fixed: Record<string, any> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string') {
      fixed[key] = fixEncoding(value);
    } else {
      fixed[key] = value;
    }
  }
  return fixed;
}

// Definición de la proyección Mexico ITRF2008 / LCC (EPSG:6372)
const MEXICO_ITRF2008_LCC = '+proj=lcc +lat_1=17.5 +lat_2=29.5 +lat_0=12 +lon_0=-102 +x_0=2500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

// Función para reproyectar coordenadas
function reprojectCoordinates(coords: number[]): number[] {
  try {
    const [x, y] = coords;
    const [lon, lat] = proj4(MEXICO_ITRF2008_LCC, WGS84, [x, y]);
    return [lon, lat];
  } catch (err) {
    console.error('Error reproyectando coordenadas:', coords, err);
    return coords;
  }
}

// Función para reproyectar un anillo de coordenadas
function reprojectRing(ring: number[][]): number[][] {
  return ring.map(coord => reprojectCoordinates(coord));
}

// Función para reproyectar la geometría completa
function reprojectGeometry(geometry: ShapeFeature['geometry']): ShapeFeature['geometry'] {
  if (geometry.type === 'Point') {
    return {
      type: 'Point',
      coordinates: reprojectCoordinates(geometry.coordinates),
    };
  } else if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates.map((ring: number[][]) => reprojectRing(ring)),
    };
  } else if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates.map((polygon: number[][][]) =>
        polygon.map(ring => reprojectRing(ring))
      ),
    };
  } else if (geometry.type === 'LineString') {
    return {
      type: 'LineString',
      coordinates: reprojectRing(geometry.coordinates),
    };
  } else if (geometry.type === 'MultiLineString') {
    return {
      type: 'MultiLineString',
      coordinates: geometry.coordinates.map((line: number[][]) => reprojectRing(line)),
    };
  } else if (geometry.type === 'MultiPoint') {
    return {
      type: 'MultiPoint',
      coordinates: geometry.coordinates.map((point: number[]) => reprojectCoordinates(point)),
    };
  }
  return geometry;
}

export function useShapefileLoader(config: ShapeConfig) {
  const [features, setFeatures] = useState<ShapeFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<string[]>([]);

  useEffect(() => {
    const loadShapefile = async () => {
      try {
        setLoading(true);
        console.log(`[${config.name}] Iniciando carga de shapefile...`);
        
        const shpUrl = `${config.basePath}/${config.fileName}.shp`;
        const dbfUrl = `${config.basePath}/${config.fileName}.dbf`;
        
        // Cargar los archivos .shp y .dbf
        const [shpResponse, dbfResponse] = await Promise.all([
          fetch(shpUrl),
          fetch(dbfUrl),
        ]);

        if (!shpResponse.ok) {
          throw new Error(`Error cargando .shp: ${shpResponse.status}`);
        }
        if (!dbfResponse.ok) {
          throw new Error(`Error cargando .dbf: ${dbfResponse.status}`);
        }

        const [shpBuffer, dbfBuffer] = await Promise.all([
          shpResponse.arrayBuffer(),
          dbfResponse.arrayBuffer(),
        ]);

        console.log(`[${config.name}] Archivos cargados - SHP:`, shpBuffer.byteLength, 'bytes, DBF:', dbfBuffer.byteLength, 'bytes');

        // Usar la librería shapefile para leer los datos
        // Especificar encoding latin1 para caracteres especiales en español
        const source = await shapefile.open(shpBuffer, dbfBuffer, { encoding: 'latin1' });
        
        const rawFeatures: ShapeFeature[] = [];
        
        // Leer todos los features
        let result = await source.read();
        while (!result.done) {
          if (result.value && result.value.geometry) {
            rawFeatures.push(result.value as ShapeFeature);
          }
          result = await source.read();
        }

        console.log(`[${config.name}] Features raw cargados:`, rawFeatures.length);
        
        // Debug: mostrar todos los nombres de municipios disponibles
        if (config.filterField) {
          const allNames = rawFeatures.map(f => f.properties?.[config.filterField!]).filter(Boolean);
          console.log(`[${config.name}] Todos los valores de ${config.filterField}:`, allNames.sort());
        }

        // Reproyectar las coordenadas de Mexico ITRF2008/LCC a WGS84
        let reprojectedFeatures = rawFeatures.map(feature => ({
          ...feature,
          geometry: reprojectGeometry(feature.geometry),
        }));
        
        // Función para normalizar texto con encoding corrupto
        // Convierte caracteres problemáticos a su versión ASCII básica
        const normalizeText = (text: string): string => {
          return text
            .toUpperCase()
            // Reemplazar secuencias de encoding corrupto comunes
            .replace(/Ã¡/g, 'A').replace(/Ã©/g, 'E').replace(/Ã­/g, 'I')
            .replace(/Ã³/g, 'O').replace(/Ãº/g, 'U').replace(/Ã±/g, 'N')
            .replace(/Ã\x81/g, 'A').replace(/Ã‰/g, 'E').replace(/Ã\x8D/g, 'I')
            .replace(/Ã"/g, 'O').replace(/Ãš/g, 'U').replace(/Ã'/g, 'N')
            // Normalización estándar de Unicode
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            // Limpiar cualquier caracter no ASCII restante
            .replace(/[^\x00-\x7F]/g, '');
        };
        
        // Aplicar filtro si está configurado
        if (config.filterField && config.filterValues && config.filterValues.length > 0) {
          const normalizedFilterValues = config.filterValues.map(v => normalizeText(v));
          
          reprojectedFeatures = reprojectedFeatures.filter(feature => {
            const fieldValue = feature.properties?.[config.filterField!];
            if (!fieldValue) return false;
            const normalizedValue = normalizeText(String(fieldValue));
            return normalizedFilterValues.includes(normalizedValue);
          });
          
          console.log(`[${config.name}] Features después de filtrar por ${config.filterField}:`, reprojectedFeatures.length);
        }
        
        // Corregir encoding corrupto en todas las propiedades
        const fixedFeatures = reprojectedFeatures.map(feature => ({
          ...feature,
          properties: fixFeatureProperties(feature.properties || {}),
        }));
        
        console.log(`[${config.name}] Features reproyectados:`, fixedFeatures.length);
        
        if (fixedFeatures.length > 0) {
          const fieldNames = Object.keys(fixedFeatures[0].properties || {});
          setFields(fieldNames);
          console.log(`[${config.name}] Campos disponibles:`, fieldNames);
          console.log(`[${config.name}] Primeros 3 registros:`, fixedFeatures.slice(0, 3).map(f => f.properties));
        }
        
        setFeatures(fixedFeatures);
        setLoading(false);
      } catch (err) {
        console.error(`[${config.name}] Error cargando shapefile:`, err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    };

    loadShapefile();
  }, [config.basePath, config.fileName, config.name]);

  return { features, loading, error, fields, config };
}

// Municipios del Corredor Esperanza-Santa Rita Tlahuapan
const CORREDOR_MUNICIPIOS = [
  'ACAJETE',
  'ACATZINGO',
  'AMOZOC',
  'CAÑADA MORELOS',
  'CHALCHICOMULA DE SESMA',
  'TLACHICHUCA',
  'ESPERANZA',
  'GENERAL FELIPE ÁNGELES',
  'GUADALUPE VICTORIA',
  'LOS REYES DE JUÁREZ',
  'PALMAR DE BRAVO',
  'QUECHOLAC',
  'SAN SALVADOR EL SECO',
  'SAN SALVADOR HUIXCOLOTLA',
  'TECAMACHALCO',
  'TEPEACA',
  'TOCHTEPEC',
];

// Configuraciones predefinidas de capas
export const LAYER_CONFIGS: ShapeConfig[] = [
  {
    id: 'municipios',
    name: 'Municipios de Puebla',
    basePath: '/ShapesBase_Puebla',
    fileName: '21mun',
    color: [65, 105, 225, 80],
    strokeColor: [65, 105, 225, 200],
  },
  {
    id: 'corredor',
    name: 'Corredor Esperanza-Santa Rita Tlahuapan',
    basePath: '/Desap2014',
    fileName: 'DESAP2014- TEST28ene',
    color: [220, 53, 69, 100],
    strokeColor: [220, 53, 69, 220],
    filterField: 'NOMGEO',
    filterValues: CORREDOR_MUNICIPIOS,
  },
];
