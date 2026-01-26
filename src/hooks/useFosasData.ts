import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';

export type FosaRecord = {
  position: [number, number]; // [lon, lat]
  raw: Record<string, any>;
};

function parseCoord(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().replace(/\s+/g, '');
  if (!v) return undefined;

  const num = Number(v);
  if (Number.isFinite(num)) return num;

  const dmsRegex = /^(\d{1,3})°(\d{1,2})'(\d{1,2}(?:\.\d+)?)"?([NSEW])$/i;
  const m = v.match(dmsRegex);
  if (m) {
    const deg = Number(m[1]);
    const min = Number(m[2]);
    const sec = Number(m[3]);
    const hemi = m[4].toUpperCase();
    if ([deg, min, sec].every(Number.isFinite)) {
      let dec = deg + min / 60 + sec / 3600;
      if (hemi === 'S' || hemi === 'W') dec *= -1;
      return dec;
    }
  }

  const dOnlyRegex = /^(\d{1,3}(?:\.\d+)?)([NSEW])$/i;
  const m2 = v.match(dOnlyRegex);
  if (m2) {
    let dec = Number(m2[1]);
    const hemi = m2[2].toUpperCase();
    if (hemi === 'S' || hemi === 'W') dec *= -1;
    return dec;
  }

  const dmsDots = /^(\d{1,3})\.(\d{1,2})\.(\d{1,2}(?:\.\d+)?)$/;
  const m3 = v.match(dmsDots);
  if (m3) {
    const deg = Number(m3[1]);
    const min = Number(m3[2]);
    const sec = Number(m3[3]);
    if ([deg, min, sec].every(Number.isFinite)) {
      return deg + min / 60 + sec / 3600;
    }
  }

  return undefined;
}

export function useFosasData() {
  const [fosas, setFosas] = useState<FosaRecord[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    const csvUrlV3 = new URL('../assets/Fosas_clandestinas_3.csv', import.meta.url).href;
    const csvUrlV2 = new URL('../assets/Fosas_clandestinas_2.csv', import.meta.url).href;

    const parseCsv = (url: string) => Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const rows = results.data as Array<Record<string, any>>;
        const feats: FosaRecord[] = [];

        for (const row of rows) {
          const yRaw = row['Coord_Y'] ?? row['coord_y'] ?? row['Y'] ?? row['lat'] ?? row['Lat'] ?? '';
          const xRaw = row['Coord_X'] ?? row['coord_x'] ?? row['X'] ?? row['lon'] ?? row['Lng'] ?? row['Long'] ?? '';

          let y = parseCoord(yRaw);
          let x = parseCoord(xRaw);

          if (typeof y === 'number' && y > -10 && y < 40 && typeof x === 'number' && x > 0 && x <= 180) {
            x = -Math.abs(x);
          }

          if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)) {
            feats.push({ position: [x, y], raw: row });
          }
        }
        if (feats.length) {
          loadedRef.current = true;
          setFosas(feats);
        }
      },
      error: (err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('Error al cargar CSV:', err);
      }
    });

    parseCsv(csvUrlV3);
    const t = setTimeout(() => {
      if (!loadedRef.current) parseCsv(csvUrlV2);
    }, 1500);

    return () => clearTimeout(t);
  }, []);

  return { fosas };
}
