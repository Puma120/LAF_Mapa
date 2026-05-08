import { useState, useEffect, useMemo } from 'react';

export interface DelitoRecord {
  CVEGEO: string;
  NOMGEO: string;
  ANIO: number;
  TIPO_DE_DELITO: string;
  ID_Categoria: number;
  CATEGORIA: string;
  INCIDENCIA: number;
  POBLACION: number;
  TASA: number;
}

export interface DelitoCategoriaInfo {
  id: number;
  name: string;
  delitos: string[];
  color: [number, number, number, number];
  strokeColor: [number, number, number, number];
}

// Color por categoría — basado en convenciones forenses y de derechos humanos
// Cat 1 Vulneración de la vida: carmesí
// Cat 2 Vulneración de libertad: naranja
// Cat 3 Sexual: morado (color internacionalmente asociado a violencia de género)
// Cat 4 Extracción de recursos: dorado
// Cat 5 Drogas/armas: verde azulado
const CATEGORIA_COLORS: Record<number, { color: [number, number, number, number]; strokeColor: [number, number, number, number] }> = {
  1: { color: [200, 20, 40, 110],  strokeColor: [200, 20, 40, 230]  },
  2: { color: [230, 110, 0, 110],  strokeColor: [230, 110, 0, 230]  },
  3: { color: [130, 0, 180, 110],  strokeColor: [130, 0, 180, 230]  },
  4: { color: [190, 145, 0, 110],  strokeColor: [190, 145, 0, 230]  },
  5: { color: [0, 145, 130, 110],  strokeColor: [0, 145, 130, 230]  },
};

/**
 * Hook para cargar el CSV de delitos del corredor Centro.
 * Retorna los registros crudos y la jerarquía de categorías -> tipos de delito.
 */
export function useDelitosData(enabled: boolean = true) {
  const [records, setRecords] = useState<DelitoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded) return;

    const loadCSV = async () => {
      try {
        setLoading(true);
        const response = await fetch('/CSVs/CSVDelitos_CORR_CEN_NUEVO.csv');
        if (!response.ok) throw new Error(`Error cargando CSV delitos: ${response.status}`);

        const buffer = await response.arrayBuffer();
        let text = new TextDecoder('utf-8').decode(buffer);
        if (text.includes('\ufffd')) {
          text = new TextDecoder('latin1').decode(buffer);
        }

        const lines = text.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV vacío');

        // Parse CSV respecting quoted fields (some CATEGORIA values contain commas)
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (ch === '"') {
              inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += ch;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]);
        const parsed: DelitoRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < headers.length) continue;

          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = values[idx]; });

          parsed.push({
            CVEGEO: row.CVEGEO || '',
            NOMGEO: row.NOMGEO || '',
            ANIO: parseInt(row.ANIO) || 0,
            TIPO_DE_DELITO: row.TIPO_DE_DELITO || '',
            ID_Categoria: parseInt(row.ID_Categoria) || 0,
            CATEGORIA: row.CATEGORIA || '',
            INCIDENCIA: parseInt(row.INCIDENCIA || '0', 10) || 0,
            POBLACION: parseInt(row.POBLACION || '0', 10) || 0,
            TASA: parseFloat(row.TASA) || 0,
          });
        }

        console.log(`[Delitos] CSV cargado: ${parsed.length} registros`);
        setRecords(parsed);
        setLoaded(true);
      } catch (err) {
        console.error('[Delitos] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCSV();
  }, [enabled, loaded]);

  // Build the category hierarchy
  const categorias = useMemo((): DelitoCategoriaInfo[] => {
    if (!records.length) return [];
    const map = new Map<number, { name: string; delitos: Set<string> }>();
    for (const r of records) {
      if (!map.has(r.ID_Categoria)) {
        map.set(r.ID_Categoria, { name: r.CATEGORIA, delitos: new Set() });
      }
      map.get(r.ID_Categoria)!.delitos.add(r.TIPO_DE_DELITO);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([id, info]) => ({
        id,
        name: info.name,
        delitos: Array.from(info.delitos).sort(),
        color: CATEGORIA_COLORS[id]?.color ?? [180, 180, 180, 110],
        strokeColor: CATEGORIA_COLORS[id]?.strokeColor ?? [180, 180, 180, 230],
      }));
  }, [records]);

  return { records, categorias, loading };
}
