import { ScatterplotLayer } from '@deck.gl/layers';
import type { MasacreRecord } from '../hooks/useMasacresData';

export function createMasacresLayer(masacres: MasacreRecord[]) {
  return new ScatterplotLayer({
    id: 'masacres-circle-layer',
    data: masacres,
    getPosition: (d: MasacreRecord) => d.position,
    getFillColor: [155, 89, 182, 220], // Purple color
    getLineColor: [75, 0, 130, 255], // Dark purple outline
    getRadius: 100,
    radiusMinPixels: 7,
    radiusMaxPixels: 100,
    lineWidthMinPixels: 2,
    stroked: true,
    filled: true,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 0, 100],
  });
}
