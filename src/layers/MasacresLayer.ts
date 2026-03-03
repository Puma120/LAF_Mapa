import { ScatterplotLayer } from '@deck.gl/layers';
import type { MasacreRecord } from '../hooks/useMasacresData';

export function createMasacresLayer(masacres: MasacreRecord[]) {
  return new ScatterplotLayer({
    id: 'masacres-circle-layer',
    data: masacres,
    getPosition: (d: MasacreRecord) => d.position,
    getFillColor: [155, 89, 182, 220],
    getLineColor: [75, 0, 130, 255],
    getRadius: 9,
    radiusUnits: 'pixels',          // radius is always 9 screen-pixels — no world math
    radiusMinPixels: 5,
    radiusMaxPixels: 22,
    lineWidthMinPixels: 1.5,
    stroked: true,
    filled: true,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 0, 100],
    parameters: { depthTest: false } as any, // 2D layer — skip depth buffer
  });
}
