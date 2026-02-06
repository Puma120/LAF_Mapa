import { useState, useEffect } from 'react';
import * as shapefile from 'shapefile';
import proj4 from 'proj4';

export interface MunicipioFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: Record<string, any>;
}

export interface MunicipiosGeoJSON {
  type: 'FeatureCollection';
  features: MunicipioFeature[];
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
function reprojectGeometry(geometry: MunicipioFeature['geometry']): MunicipioFeature['geometry'] {
  if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: (geometry.coordinates as number[][][]).map(ring => reprojectRing(ring)),
    };
  } else if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: (geometry.coordinates as number[][][][]).map(polygon =>
        polygon.map(ring => reprojectRing(ring))
      ),
    };
  }
  return geometry;
}

export function useMunicipiosShape() {
  const [municipios, setMunicipios] = useState<MunicipioFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShapefile = async () => {
      try {
        setLoading(true);
        console.log('Iniciando carga de shapefile...');
        
        // Cargar los archivos .shp y .dbf
        const [shpResponse, dbfResponse] = await Promise.all([
          fetch('/ShapesBase_Puebla/21mun.shp'),
          fetch('/ShapesBase_Puebla/21mun.dbf'),
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

        console.log('Archivos cargados - SHP:', shpBuffer.byteLength, 'bytes, DBF:', dbfBuffer.byteLength, 'bytes');

        // Usar la librería shapefile para leer los datos
        const source = await shapefile.open(shpBuffer, dbfBuffer);
        
        const rawFeatures: MunicipioFeature[] = [];
        
        // Leer todos los features
        let result = await source.read();
        while (!result.done) {
          if (result.value && result.value.geometry) {
            rawFeatures.push(result.value as MunicipioFeature);
          }
          result = await source.read();
        }

        console.log('Features raw cargados:', rawFeatures.length);

        // Reproyectar las coordenadas de Mexico ITRF2008/LCC a WGS84
        const reprojectedFeatures = rawFeatures.map(feature => ({
          ...feature,
          geometry: reprojectGeometry(feature.geometry),
        }));
        
        console.log('Municipios cargados y reproyectados:', reprojectedFeatures.length);
        if (reprojectedFeatures.length > 0) {
          const firstCoord = reprojectedFeatures[0].geometry.type === 'Polygon' 
            ? reprojectedFeatures[0].geometry.coordinates[0][0]
            : reprojectedFeatures[0].geometry.coordinates[0][0][0];
          console.log('Ejemplo de coordenadas reproyectadas:', firstCoord);
          console.log('Propiedades del primer feature:', reprojectedFeatures[0].properties);
          console.log('Campos disponibles:', Object.keys(reprojectedFeatures[0].properties || {}));
          console.log('Primeros 5 municipios:', reprojectedFeatures.slice(0, 5).map(f => f.properties));
        }
        
        setMunicipios(reprojectedFeatures);
        setLoading(false);
      } catch (err) {
        console.error('Error cargando shapefile de municipios:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    };

    loadShapefile();
  }, []);

  return { municipios, loading, error };
}
