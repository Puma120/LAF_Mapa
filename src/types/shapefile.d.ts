declare module 'shapefile' {
  interface Feature {
    type: 'Feature';
    geometry: {
      type: string;
      coordinates: any;
    };
    properties: Record<string, any>;
  }

  interface Source {
    read(): Promise<{ done: boolean; value?: Feature }>;
    cancel(): Promise<void>;
  }

  export function open(
    shp: ArrayBuffer | string,
    dbf?: ArrayBuffer | string,
    options?: { encoding?: string }
  ): Promise<Source>;

  export function read(
    shp: ArrayBuffer | string,
    dbf?: ArrayBuffer | string,
    options?: { encoding?: string }
  ): Promise<{ type: 'FeatureCollection'; features: Feature[] }>;
}
