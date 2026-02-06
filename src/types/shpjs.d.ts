declare module 'shpjs' {
  interface GeoJSONFeature {
    type: 'Feature';
    geometry: {
      type: string;
      coordinates: any;
    };
    properties: Record<string, any>;
  }

  interface GeoJSONFeatureCollection {
    type: 'FeatureCollection';
    features: GeoJSONFeature[];
  }

  interface ShpJS {
    (input: string | ArrayBuffer): Promise<GeoJSONFeatureCollection | GeoJSONFeatureCollection[]>;
    parseShp(shp: ArrayBuffer, dbf?: ArrayBuffer): Promise<any[]>;
    parseDbf(dbf: ArrayBuffer): Promise<Record<string, any>[]>;
  }

  const shp: ShpJS;
  export default shp;
}
