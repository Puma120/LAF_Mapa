import { useState, useEffect } from 'react';

export interface DesapRecord {
  CVEGEO: string;
  CVE_ENT: string;
  CVE_MUN: string;
  NOMGEO: string;
  Hombres: number;
  Mujeres: number;
  Total: number;
  Poblacion: number;
  Anio: number;
  TASA_100K: number;
}

export interface DesapMunicipioData {
  CVEGEO: string;
  NOMGEO: string;
  records: DesapRecord[];
  byYear: Map<number, DesapRecord>;
}

/**
 * Hook para cargar datos de desapariciones del CSV Base_Desap_TasaValores.csv
 * Retorna un Map<CVEGEO, DesapMunicipioData> con los datos agrupados por municipio
 */
export function useDesapData() {
  const [data, setData] = useState<Map<string, DesapMunicipioData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    const loadCSV = async () => {
      try {
        setLoading(true);
        const response = await fetch('/CSVs/Base_Desap_TasaValores.csv');
        if (!response.ok) throw new Error(`Error cargando CSV: ${response.status}`);

        // Cargar como ArrayBuffer para manejar encoding
        const buffer = await response.arrayBuffer();
        let text = new TextDecoder('utf-8').decode(buffer);
        // Si hay caracteres corruptos, intentar con Latin-1
        if (text.includes('�')) {
          text = new TextDecoder('latin1').decode(buffer);
        }

        const lines = text.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV vacío');

        const headers = lines[0].split(',').map(h => h.trim());
        const map = new Map<string, DesapMunicipioData>();
        const yearSet = new Set<number>();

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length < headers.length) continue;

          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = values[idx]; });

          const anio = parseInt(row.Anio);
          const cvegeo = row.CVEGEO;
          if (!cvegeo || !anio || isNaN(anio)) continue;

          const record: DesapRecord = {
            CVEGEO: cvegeo,
            CVE_ENT: row.CVE_ENT || '',
            CVE_MUN: row.CVE_MUN || '',
            NOMGEO: row.NOMGEO || '',
            Hombres: parseFloat(row.Hombres) || 0,
            Mujeres: parseFloat(row.Mujeres) || 0,
            Total: parseFloat(row.Total) || 0,
            Poblacion: parseFloat(row.Poblacion) || 0,
            Anio: anio,
            TASA_100K: parseFloat(row.TASA_100K) || 0,
          };

          yearSet.add(anio);

          if (!map.has(cvegeo)) {
            map.set(cvegeo, {
              CVEGEO: cvegeo,
              NOMGEO: record.NOMGEO,
              records: [],
              byYear: new Map(),
            });
          }

          const municipio = map.get(cvegeo)!;
          municipio.records.push(record);
          municipio.byYear.set(anio, record);
        }

        setData(map);
        setYears(Array.from(yearSet).sort((a, b) => a - b));
        setLoading(false);
        console.log(`[DesapCSV] Cargados datos de ${map.size} municipios, años: ${Array.from(yearSet).sort().join(', ')}`);
      } catch (err) {
        console.error('[DesapCSV] Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    };

    loadCSV();
  }, []);

  return { data, loading, error, years };
}
