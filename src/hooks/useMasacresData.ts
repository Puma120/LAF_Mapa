import { useState, useEffect } from 'react';
import Papa from 'papaparse';

export type MasacreRecord = {
  position: [number, number];
  raw: Record<string, any>;
};

export function useMasacresData() {
  const [masacres, setMasacres] = useState<MasacreRecord[]>([]);

  useEffect(() => {
    const csvPath = new URL('../assets/Base de Datos - Masacres (1).csv', import.meta.url).href;
    
    Papa.parse(csvPath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parseCoord = (val: any): number => {
          if (val == null) return 0;
          const s = String(val).trim();
          if (!s) return 0;
          const n = parseFloat(s);
          return isNaN(n) ? 0 : n;
        };

        const records: MasacreRecord[] = [];
        for (const row of results.data as Record<string, any>[]) {
          const lon = parseCoord(row['coord_x']);
          const lat = parseCoord(row['coord_y']);
          
          if (lon !== 0 && lat !== 0) {
            records.push({
              position: [lon, lat],
              raw: row,
            });
          }
        }
        setMasacres(records);
      },
      error: (err) => {
        console.error('Error loading masacres CSV:', err);
      },
    });
  }, []);

  return { masacres };
}
