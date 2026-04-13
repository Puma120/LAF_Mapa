// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// https://github.com/visgl/deck.gl/tree/9.1-release/examples/get-started/react
// https://d2ad6b4ur7yvpq.cloudfront.net

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { bbox, centroid } from '@turf/turf';
import {DeckGL} from 'deck.gl';
// import {CompassWidget} from '@deck.gl/react';
import '@deck.gl/widgets/stylesheet.css';
import { TileLayer, TerrainLayer } from "@deck.gl/geo-layers";
import {FlyToInterpolator, WebMercatorViewport} from '@deck.gl/core';
import { BitmapLayer } from "@deck.gl/layers";
import type { TileLayerProps } from "@deck.gl/geo-layers";
import Compass from './components/Compass';
import FosaPopup from './components/FosaPopup';
import MasacrePopup from './components/MasacrePopup';
import MunicipioPopup, { type MunicipioProperties } from './components/MunicipioPopup';
import LoginModal from './components/LoginModal';
import AdminPanel, { type UploadedCSV } from './components/AdminPanel';
import WelcomeScreen from './components/WelcomeScreen';
import CorredoresIntro from './components/CorredoresIntro';
import AmozocPanel from './components/AmozocPanel';
import AmozocTimelineBar from './components/AmozocTimelineBar';
import { useAuth } from './contexts/AuthContext';
import { createFosasLayer, createModalidadPolygons, getModalidadesWithColors } from './layers/FosasLayer';
import { createMasacresLayer } from './layers/MasacresLayer';
import { createShapeLayer } from './layers/ShapeLayer';
import { createCorredorLineLayer, CORREDOR_LINES } from './layers/CorredorLineLayer';
import { useFosasData } from './hooks/useFosasData';
import { useMasacresData, type MasacreRecord } from './hooks/useMasacresData';
import { useShapefileLoader, LAYER_CONFIGS } from './hooks/useShapefileLoader';
import { useDesapData } from './hooks/useDesapData';
import type { FosaRecord } from './hooks/useFosasData';
import UnifiedFilterPanel, { type UnifiedFilters } from './components/UnifiedFilterPanel';
import Timeline from './components/Timeline';
import ModalidadLegend from './components/ModalidadLegend';
import logoLAF from './assets/Logo-LAF-Blanco.png';
import logoIbero from './assets/Logo-Ibero.png';

type SelectedFeature =
  | { type: 'fosa'; rec: FosaRecord }
  | { type: 'masacre'; rec: MasacreRecord }
  | { type: 'municipio'; properties: MunicipioProperties }
  | null;

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
// const COUNTRIES = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson'; 


const PANEL_W = 270;

const INITIAL_VIEW_STATE = {
  longitude: -102,
  latitude: 23,
  zoom: 5,
  bearing: 0,
  pitch: 0
};


function Root() {
  const { isAdmin, isAuthenticated, logout } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [showAmozoc, setShowAmozoc] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [uploadedCSVs, setUploadedCSVs] = useState<UploadedCSV[]>([]);
  // Save state before entering info/amozoc mode so we can restore on exit
  const savedStateRef = useRef<{
    activeLayers: string[];
    filters: UnifiedFilters;
    viewState: any;
  } | null>(null);

  const handleCSVUpload = useCallback((csv: UploadedCSV) => {
    setUploadedCSVs(prev => [...prev, csv]);
  }, []);

  const handleCSVRemove = useCallback((csvId: string) => {
    setUploadedCSVs(prev => prev.filter(c => c.id !== csvId));
  }, []);

  const [mapStyle, setMapStyle] = useState<number>(0);
  const { fosas } = useFosasData();
  const { masacres } = useMasacresData();
  
  // Estado de capas activas (ninguna activa al inicio)
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  
  // Cargar capas de shapefiles SOLO cuando están activas (lazy loading)
  // municipios también se necesita si desapariciones está activa (comparten polígonos)
  // O si showAmozoc está activo (necesitamos el polígono de Amozoc)
  const needsMunicipios = activeLayers.includes('municipios') || activeLayers.includes('desapariciones') || showAmozoc;
  const municipiosData = useShapefileLoader(LAYER_CONFIGS[0], needsMunicipios);
  const corredorData = useShapefileLoader(LAYER_CONFIGS[1], activeLayers.includes('corredor'));
  const homicidioDolosoData = useShapefileLoader(LAYER_CONFIGS[3], activeLayers.includes('homicidio_doloso'));
  
  // Cargar datos de desapariciones del CSV solo cuando la capa está activa
  const desapCSV = useDesapData(activeLayers.includes('desapariciones'));

  // Cargar líneas de corredor (GeoJSON) cuando el corredor está activo
  const [corredorLineData, setCorredorLineData] = useState<Record<string, any>>({});
  useEffect(() => {
    if (!activeLayers.includes('corredor')) return;
    for (const lineConfig of CORREDOR_LINES) {
      if (corredorLineData[lineConfig.id]) continue;
      fetch(lineConfig.url)
        .then(r => r.json())
        .then(data => setCorredorLineData(prev => ({ ...prev, [lineConfig.id]: data })))
        .catch(err => console.error(`Error loading corredor line ${lineConfig.id}:`, err));
    }
  }, [activeLayers, corredorLineData]);
  
  // Enriquecer polígonos de municipios con datos del CSV de desapariciones
  const desapFeatures = useMemo(() => {
    if (municipiosData.loading || desapCSV.loading || !desapCSV.data.size) return [];
    
    return municipiosData.features
      .filter(f => desapCSV.data.has(f.properties?.CVEGEO))
      .map(f => {
        const csvData = desapCSV.data.get(f.properties.CVEGEO)!;
        const props = { ...f.properties };
        
        // Agregar datos del CSV por año con prefijo _DESAP_
        for (const [year, record] of csvData.byYear) {
          props[`_DESAP_TOTAL_${year}`] = record.Total;
          props[`_DESAP_H_${year}`] = record.Hombres;
          props[`_DESAP_M_${year}`] = record.Mujeres;
          props[`_DESAP_POB_${year}`] = record.Poblacion;
          props[`_DESAP_TASA_${year}`] = record.TASA_100K;
        }
        props._hasDesapData = true;
        
        return { ...f, properties: props };
      });
  }, [municipiosData.features, municipiosData.loading, desapCSV.data, desapCSV.loading]);
  
  // Feature de Amozoc filtrado de municipios (para capa verde en modo Amozoc)
  const amozocFeatures = useMemo(() => {
    if (!showAmozoc || municipiosData.loading) return [];
    return municipiosData.features.filter(f => {
      const name = String(f.properties?.NOMGEO ?? '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return name === 'AMOZOC';
    });
  }, [showAmozoc, municipiosData.features, municipiosData.loading]);

  // Filtrar homicidio doloso: solo municipios con información
  const homicidioDolosoFiltered = useMemo(() => {
    return homicidioDolosoData.features.filter(f => {
      const p = f.properties || {};
      // Mantener solo features que tengan al menos un campo de datos no nulo
      return p['Tipo de de'] != null || p['Incidencia'] != null;
    });
  }, [homicidioDolosoData.features]);

  // useMemo so the reference stays stable between renders — prevents layers useMemo from
  // re-running when unrelated state (panel collapse, selectedFeature, etc.) changes.
  const shapeLayersData = useMemo(() => ({
    municipios: { features: municipiosData.features, loading: municipiosData.loading },
    corredor: { features: corredorData.features, loading: corredorData.loading },
    desapariciones: { features: desapFeatures, loading: municipiosData.loading || desapCSV.loading },
    homicidio_doloso: { features: homicidioDolosoFiltered, loading: homicidioDolosoData.loading },
  } as Record<string, { features: any[]; loading: boolean }>), [
    municipiosData.features, municipiosData.loading,
    corredorData.features, corredorData.loading,
    desapFeatures,
    desapCSV.loading,
    homicidioDolosoFiltered, homicidioDolosoData.loading,
  ]);
  
  const loadingLayers = Object.entries(shapeLayersData)
    .filter(([, data]) => data.loading)
    .map(([id]) => id);

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature>(null);
  const [filters, setFilters] = useState<UnifiedFilters>({
    anio: [],
    municipio: [],
    zona: [],
    modalidad: [],
    hallazgo: [],
    texto: '',
    showFosas: false,
    showMasacres: false,
  });
  const [is3D, setIs3D] = useState<boolean>(false);
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  // Debounced yearRange: only used for the expensive layers useMemo so dragging
  // the slider stays smooth but GPU layer rebuilds happen at most every 100 ms.
  const [debouncedYearRange, setDebouncedYearRange] = useState<[number, number] | null>(null);
  const yearRangeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (yearRangeDebounceRef.current) clearTimeout(yearRangeDebounceRef.current);
    yearRangeDebounceRef.current = setTimeout(() => setDebouncedYearRange(yearRange), 100);
    return () => { if (yearRangeDebounceRef.current) clearTimeout(yearRangeDebounceRef.current); };
  }, [yearRange]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Enter info / corredores overlay mode (from ? button)
  const enterInfoMode = useCallback(() => {
    savedStateRef.current = { activeLayers, filters, viewState };
    setShowIntro(true);
    setActiveLayers(['desapariciones']);
    setFilters(prev => ({ ...prev, showFosas: false, showMasacres: false }));
    setViewState({
      longitude: -95.9, latitude: 19.2, zoom: 7.2,
      bearing: 0, pitch: 0,
      transitionDuration: 1200,
      transitionInterpolator: new FlyToInterpolator(),
    } as any);
  }, [activeLayers, filters, viewState]);

  // Enter Caso Amozoc isolated view
  const enterAmozocMode = useCallback(() => {
    savedStateRef.current = { activeLayers, filters, viewState };
    setShowAmozoc(true);
    setActiveLayers([]);
    setFilters(prev => ({ ...prev, municipio: ['Amozoc'], showFosas: true, showMasacres: true }));
    setViewState({
      longitude: -98.05, latitude: 19.04, zoom: 12,
      bearing: 0, pitch: 0,
      transitionDuration: 1200,
      transitionInterpolator: new FlyToInterpolator(),
    } as any);
  }, [activeLayers, filters, viewState]);

  // Exit Caso Amozoc isolated view
  const exitAmozocMode = useCallback(() => {
    setShowAmozoc(false);
    const saved = savedStateRef.current;
    if (saved) {
      setActiveLayers(saved.activeLayers);
      setFilters(saved.filters);
      setViewState({ ...saved.viewState, transitionDuration: 1200, transitionInterpolator: new FlyToInterpolator() });
      savedStateRef.current = null;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    console.log('mapStyle', mapStyle);
  }, [mapStyle]);

  
  // "https://gaia.inegi.org.mx/NLB/tunnel/wms/wms61?",
  const maps = [
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    "https://api-laf.vercel.app/xyz/Hipsografico/{z}/{x}/{y}.png"
  ];

  const onChangeMap = () => {
    setMapStyle((mapStyle + 1) % maps.length);
  }

  // const toggle3D = () => {
  //   const newIs3D = !is3D;
  //   setIs3D(newIs3D);
  //   setViewState(vs => ({
  //     ...vs,
  //     pitch: newIs3D ? 30 : 0,
  //     zoom: newIs3D ? Math.max(vs.zoom ?? 5, 9) : vs.zoom, // Asegurar zoom mínimo para 3D
  //   }));
  // }
  
  const renderTileSubLayers = useCallback((props: any) => {
    const { boundingBox } = props.tile;
    return new BitmapLayer({
      id: props.id,
      image: props.data,
      bounds: [
        boundingBox[0][0],
        boundingBox[0][1],
        boundingBox[1][0],
        boundingBox[1][1],
      ],
    });
  }, []);

  const filteredFosas = useMemo(() => {
    const get = (row: Record<string, any>, keys: string[]) => {
      for (const k of keys) {
        const v = row[k];
        if (v != null && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    };

    const cleanYear = (s: string) => String(s).trim().replace(/\.0+$/, '');

    const extractYear = (row: Record<string, any>): string => {
      const primary = cleanYear(get(row, ['AÑO','Anio','Año','año']));
      if (primary) return primary;
      const fecha = get(row, ['FECHA DEL HALLAZGO','Fecha']);
      if (fecha) {
        const m = fecha.match(/\b(19|20)\d{2}\b/);
        if (m) return m[0];
      }
      return '';
    };

    const matches = (f: FosaRecord) => {
      const a = extractYear(f.raw);
      const m = get(f.raw, ['MUNICIPIO','MUNUCUPIO']);
      const z = get(f.raw, ['ZONA']);
      const mod = get(f.raw, ['MODALIDAD DE FOSA','MODALIDAD']);
      const h = get(f.raw, ['QUIÉN HIZO EL HALLAZGO','QUIEN HIZO EL HALLAZGO']);
      const desc = get(f.raw, ['DESCRIPCIÓN','Descripcion','DESCRIPCION']);

      if (filters.anio.length && !filters.anio.includes(a)) return false;
      if (filters.municipio.length && !filters.municipio.includes(m)) return false;
      if (filters.zona.length && !filters.zona.includes(z)) return false;
      if (filters.modalidad.length && !filters.modalidad.includes(mod)) return false;
      if (filters.hallazgo.length && !filters.hallazgo.includes(h)) return false;
      if (filters.texto) {
        const q = filters.texto.toLowerCase();
        if (!desc.toLowerCase().includes(q)) return false;
      }
      return true;
    };

    const res = fosas.filter(matches);
    return res;
  }, [fosas, filters]);

  const filteredMasacres = useMemo(() => {
    const get = (row: Record<string, any>, keys: string[]) => {
      for (const k of keys) {
        const v = row[k];
        if (v != null && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    };
    
    const parseYear = (val: unknown): string => {
      if (val == null) return '';
      const s = String(val).trim();
      if (!s) return '';
      const cleaned = s.replace(/\.0+$/, '');
      const n = Number(cleaned);
      if (Number.isInteger(n) && n >= 1900 && n <= 2100) return String(n);
      const m = s.match(/\b(19|20)\d{2}\b/);
      if (m) return m[0];
      return '';
    };
    
    const matches = (m: MasacreRecord) => {
      const anio = parseYear(m.raw?.['año'] ?? m.raw?.['fecha']);
      const municipio = get(m.raw, ['Municipio', 'MUNICIPIO', 'municipio']);
      const texto = [
        get(m.raw, ['Descripción resumida', 'DESCRIPCIÓN', 'Descripcion', 'DESCRIPCION']),
        get(m.raw, ['LUGAR', 'Lugar', 'lugar'])
      ].join(' ').toLowerCase();

      // Filtro de año desde la línea del tiempo
      if (filters.anio.length && !filters.anio.includes(anio)) return false;
      if (filters.municipio.length && !filters.municipio.includes(municipio)) return false;
      if (filters.texto && !texto.includes(filters.texto.toLowerCase())) return false;
      return true;
    };
    return masacres.filter(matches);
  }, [masacres, filters]);

  
  // Compute available years from data (unique, numeric, sane range) - both fosas and masacres
  const allYears = useMemo(() => {
    const set = new Set<number>();

    const parseYear = (val: unknown): number | null => {
      if (val == null) return null;
      const s = String(val).trim();
      if (!s) return null;
      // Try direct number (handle trailing .0)
      const cleaned = s.replace(/\.0+$/, '');
      const n = Number(cleaned);
      if (Number.isInteger(n) && n >= 1900 && n <= 2100) return n;
      // Try to extract a 4-digit year from any date-like string
      const m = s.match(/\b(19|20)\d{2}\b/);
      if (m) {
        const n2 = Number(m[0]);
        if (n2 >= 1900 && n2 <= 2100) return n2;
      }
      return null;
    };

    // Años de fosas
    for (const f of fosas) {
      const y1 = parseYear(f.raw?.['AÑO'] ?? f.raw?.['Anio'] ?? f.raw?.['Año'] ?? f.raw?.['año']);
      const y2 = parseYear(f.raw?.['FECHA DEL HALLAZGO']);
      const y = y1 ?? y2;
      if (y != null) set.add(y);
    }
    
    // Años de masacres
    for (const m of masacres) {
      const y = parseYear(m.raw?.['año'] ?? m.raw?.['fecha']);
      if (y != null) set.add(y);
    }
    
    return Array.from(set).sort((a, b) => a - b);
  }, [fosas, masacres]);

  // Initialize timeline year range once years are known
  useEffect(() => {
    if (allYears.length && !yearRange) {
      setYearRange([allYears[0], allYears[allYears.length - 1]]);
    }
  }, [allYears, yearRange]);

  // When debouncedYearRange changes, sync filters.anio — uses debounced value so
  // re-filtering fosas/masacres doesn't happen on every drag pixel.
  useEffect(() => {
    if (!allYears.length || !debouncedYearRange) return;
    const [minY, maxY] = debouncedYearRange;
    const selectedYears = allYears.filter(y => y >= minY && y <= maxY).map(String);
    setFilters(prev => ({ ...prev, anio: selectedYears }));
  }, [debouncedYearRange, allYears]);

  // Calcular modalidades visibles para la leyenda
  const modalidadesInfo = useMemo(() => {
    if (filters.modalidad.length === 0) return [];
    return getModalidadesWithColors(filteredFosas);
  }, [filteredFosas, filters.modalidad]);

  
  const layers = useMemo(() => {
    // Bounding box de México para limitar las tiles cargadas
    // [west, south, east, north]
    const MEXICO_EXTENT: [number, number, number, number] = [-120, 13, -85, 34];

    const baseLayers: any[] = [
      new TileLayer({
        id: "tile-layer",
        minZoom: 0,
        maxZoom: 18,
        tileSize: 256,
        extent: MEXICO_EXTENT,
        data: maps[mapStyle],
        renderSubLayers: renderTileSubLayers,
        pickable: false,
      } as TileLayerProps),
    ];

    // Agregar capas de shapefiles activas
    for (const config of LAYER_CONFIGS) {
      if (activeLayers.includes(config.id)) {
        const layerData = shapeLayersData[config.id];
        if (layerData && layerData.features.length > 0 && !layerData.loading) {
          baseLayers.push(createShapeLayer(config.id, layerData.features, config, {
            visible: true,
            pickable: true,
            highlightColor: [255, 255, 100, 150],
            // Pasar debouncedYearRange para evitar recálculo GPU en cada pixel del slider
            yearRange: (config.id === 'corredor' || config.id === 'desapariciones') ? debouncedYearRange : null,
            onClick: (info: any) => {
              if (info?.object?.properties) {
                setSelectedFeature({ 
                  type: 'municipio', 
                  properties: info.object.properties as MunicipioProperties 
                });
                try {
                  const feat = info.object;
                  const center = centroid(feat);
                  const [lng, lat] = center.geometry.coordinates;
                  const bounds = bbox(feat);
                  const span = Math.max(bounds[2] - bounds[0], bounds[3] - bounds[1]);
                  const zoom = span < 0.15 ? 12 : span < 0.4 ? 10.5 : 9;
                  setViewState(vs => ({
                    ...vs,
                    longitude: lng,
                    latitude: lat,
                    zoom,
                    transitionDuration: 800,
                    transitionInterpolator: new FlyToInterpolator(),
                  }));
                } catch { /* ignore bad geometries */ }
              }
            },
          }));
        }
      }
    }

    // Capa verde de Amozoc (solo en modo Caso Amozoc)
    if (showAmozoc && amozocFeatures.length > 0) {
      baseLayers.push(createShapeLayer('amozoc-highlight', amozocFeatures, {
        id: 'amozoc-highlight',
        name: 'Amozoc',
        basePath: '',
        fileName: '',
        color: [34, 197, 94, 120],
        strokeColor: [22, 163, 74, 240],
      }, {
        visible: true,
        pickable: true,
        highlightColor: [34, 197, 94, 180],
        onClick: (info: any) => {
          if (info?.object?.properties) {
            setSelectedFeature({ type: 'municipio', properties: info.object.properties as MunicipioProperties });
          }
        },
      }));
    }

    // Agregar líneas de corredor (SVG/GeoJSON) encima de las capas de polígonos
    if (activeLayers.includes('corredor')) {
      for (const lineConfig of CORREDOR_LINES) {
        const lineData = corredorLineData[lineConfig.id];
        if (lineData) {
          const lineLayer = createCorredorLineLayer(lineConfig, lineData, true);
          if (lineLayer) baseLayers.push(lineLayer);
        }
      }
    }

    // Agregar polígonos de modalidad si hay filtros activos
    const modalidadPolygonLayer = createModalidadPolygons(filteredFosas);
    if (modalidadPolygonLayer && filters.modalidad.length > 0) {
      baseLayers.push(modalidadPolygonLayer);
    }

    // Agregar capas de puntos según visibilidad
    if (filters.showFosas) {
      baseLayers.push(createFosasLayer(filteredFosas));
    }
    if (filters.showMasacres) {
      baseLayers.push(createMasacresLayer(filteredMasacres));
    }

    if (is3D) {
      // Modo 3D: Solo TerrainLayer (sin capas 2D para mejor rendimiento)
      baseLayers.push(
        new TerrainLayer({
          id: 'terrain',
          minZoom: 9,
          maxZoom: 15,
          strategy: 'no-overlap',
          elevationDecoder: {
            rScaler: 6553.6,
            gScaler: 25.6,
            bScaler: 0.1,
            offset: -10000
          },
          elevationData: 'https://pingul-maps.hf.space/tiles/{z}/{x}/{y}.png',
          texture: maps[mapStyle],
          wireframe: false,
          color: [255, 255, 255]
        })
      );
    } else {
      // Modo 2D: Curvas de nivel INEGI como teselas XYZ vía backend (después del mapa base)
      baseLayers.push(
        // new TileLayer({
        //   id: 'inegi-curvas-xyz',
        //   // data: 'http://localhost:3001/xyz/c206/{z}/{x}/{y}.png',
        //   // data: 'http://localhost:3001/xyz/Hipsografico/{z}/{x}/{y}.png',
        //   data: 'http://localhost:3001/xyz/c100/{z}/{x}/{y}.png', // Estados
        //   // data: 'http://localhost:3001/xyz/c108/{z}/{x}/{y}.png',
        //   // data: 'http://localhost:3001/xyz/c109/{z}/{x}/{y}.png',
        //   minZoom: 0,
        //   maxZoom: 18,
        //   tileSize: 256,
        //   renderSubLayers: props => {
        //     const { boundingBox, data } = props.tile;
        //     return new BitmapLayer({
        //       id: props.id,
        //       bounds: [
        //         boundingBox[0][0], boundingBox[0][1],
        //         boundingBox[1][0], boundingBox[1][1]
        //       ],
        //       image: data,
        //       opacity: 2
        //     });
        //   }
        // }),

        // new TileLayer({
        //   id: 'inegi-c842-xyz',
        //   // data: 'http://localhost:3001/xyz/RNC/{z}/{x}/{y}.png',
        //   data: 'http://localhost:3001/xyz/c101/{z}/{x}/{y}.png',
        //   minZoom: 0,
        //   maxZoom: 18,
        //   tileSize: 256,
        //   renderSubLayers: props => {
        //     const { boundingBox, data } = props.tile;
        //     return new BitmapLayer({
        //       id: props.id,
        //       bounds: [
        //         boundingBox[0][0], boundingBox[0][1],
        //         boundingBox[1][0], boundingBox[1][1]
        //       ],
        //       image: data,
        //       opacity: 0.1
        //     });
        //   }
        // }),
      );
    }

    return baseLayers;
  }, [mapStyle, filteredFosas, filteredMasacres, renderTileSubLayers, is3D, filters.modalidad, filters.showFosas, filters.showMasacres, activeLayers, shapeLayersData, debouncedYearRange, corredorLineData, showAmozoc, amozocFeatures]);
    

  // Pantalla de bienvenida (después de todos los hooks)
  if (showWelcome) {
    return (
      <WelcomeScreen
        onEnter={() => {
          setShowWelcome(false);
          // No activar capas ni puntos al entrar
          setActiveLayers([]);
          setViewState({
            longitude: -98.2,
            latitude: 19.0,
            zoom: 7.8,
            bearing: 0,
            pitch: 0,
            transitionDuration: 1800,
            transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
          } as any);
        }}
      />
    );
  }

  return (
    <div>
      <DeckGL
        pickingRadius={12}
        controller={showIntro ? false : {
          inertia: 150,
          scrollZoom: {speed: 0.01, smooth: false},
          dragPan: true,
          dragRotate: true,
          doubleClickZoom: true,
        }}
        viewState={viewState}
        onViewStateChange={(e: any) => {
          const { transitionDuration, transitionInterpolator, ...rest } = e.viewState || {};
          setViewState(rest);
        }}
        onClick={(info: any) => {
          // Manejar click en fosas
          if (info?.object && info?.layer?.id === 'fosas-circle-layer') {
            const feature = info.object as FosaRecord;
            const [longitude, latitude] = feature.position;

            if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
              setViewState((vs) => ({
                ...vs,
                longitude,
                latitude,
                zoom: Math.min(Math.max(vs.zoom ?? 7, 15), 18),
                transitionDuration: 800,
                transitionInterpolator: new FlyToInterpolator(),
              }));

              setSelectedFeature({ type: 'fosa', rec: feature });
            }
          }
          // Manejar click en masacres
          else if (info?.object && info?.layer?.id === 'masacres-circle-layer') {
            const feature = info.object as MasacreRecord;
            const [longitude, latitude] = feature.position;

            if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
              setViewState((vs) => ({
                ...vs,
                longitude,
                latitude,
                zoom: Math.min(Math.max(vs.zoom ?? 7, 14), 18),
                transitionDuration: 800,
                transitionInterpolator: new FlyToInterpolator(),
              }));

              setSelectedFeature({ type: 'masacre', rec: feature });
            }
          }
          // El click en capas de shapefiles se maneja en el onClick del layer
          else if (info?.layer?.id?.startsWith('shape-layer-')) {
            // No hacer nada aquí, el onClick del layer ya maneja esto
          }
          else {
            // Click fuera de puntos: cerrar popup
            if (selectedFeature) setSelectedFeature(null);
          }
        }}
        layers={layers}
      >
        {!showIntro && (
        <div className='absolute flex items-center right-4 bottom-[140px] flex-col'>
          <Compass
            bearing={viewState.bearing ?? 0}
            onReset={() => setViewState((vs) => ({
              ...vs,
              bearing: 0,
              transitionDuration: 300,
              transitionInterpolator: new FlyToInterpolator(),
            }))}
          />
          <button 
            className='px-4 py-2 bg-white cursor-pointer font-semibold text-black rounded-lg'
            onClick={() => setViewState(INITIAL_VIEW_STATE)}
          >
            Inicio
          </button>
        </div>
        )}

        {!showIntro && !showAmozoc && (
        <UnifiedFilterPanel
          fosas={fosas}
          masacres={masacres}
          filteredFosas={filteredFosas}
          filteredMasacres={filteredMasacres}
          value={filters}
          onChange={setFilters}
          onClear={() => setFilters({
            anio: [],
            municipio: [],
            zona: [],
            modalidad: [],
            hallazgo: [],
            texto: '',
            showFosas: true,
            showMasacres: true,
          })}
          onSelectFosa={(feature: FosaRecord) => {
            const [longitude, latitude] = feature.position;
            setViewState((vs) => ({
              ...vs,
              longitude,
              latitude,
              zoom: Math.min(Math.max(vs.zoom ?? 7, 15), 25),
              transitionDuration: 800,
              transitionInterpolator: new FlyToInterpolator(),
            }));
            setSelectedFeature({ type: 'fosa', rec: feature });
          }}
          onSelectMasacre={(m: MasacreRecord) => {
            const [longitude, latitude] = m.position;
            setViewState((vs) => ({
              ...vs,
              longitude,
              latitude,
              zoom: Math.min(Math.max(vs.zoom ?? 7, 14), 25),
              transitionDuration: 800,
              transitionInterpolator: new FlyToInterpolator(),
            }));
            setSelectedFeature({ type: 'masacre', rec: m });
          }}
          onCollapsedChange={setIsPanelCollapsed}
          layers={LAYER_CONFIGS}
          activeLayers={activeLayers}
          onToggleLayer={(layerId) => {
            setActiveLayers(prev =>
              prev.includes(layerId)
                ? prev.filter(id => id !== layerId)
                : [...prev, layerId]
            );
          }}
          loadingLayers={loadingLayers}
          onEnterAmozoc={showAmozoc ? undefined : enterAmozocMode}
          onEnterInfo={enterInfoMode}
        />
        )}

        {!showIntro && showAmozoc && (
          <AmozocPanel
            onExit={exitAmozocMode}
            onCollapsedChange={setIsPanelCollapsed}
          />
        )}

        {selectedFeature?.type === 'fosa' && (() => {
          const vp = new WebMercatorViewport({
            ...viewState,
            width: window.innerWidth || 800,
            height: window.innerHeight || 600,
          });
          const [px, py] = vp.project(selectedFeature.rec.position);
          return (
            <FosaPopup x={px} y={py} feature={selectedFeature.rec} onClose={() => setSelectedFeature(null)} />
          );
        })()}
        {selectedFeature?.type === 'masacre' && (
          <MasacrePopup feature={selectedFeature.rec} onClose={() => setSelectedFeature(null)} />
        )}
        {selectedFeature?.type === 'municipio' && (
          <MunicipioPopup 
            properties={selectedFeature.properties} 
            onClose={() => setSelectedFeature(null)} 
            yearRange={yearRange ?? undefined}
          />
        )}
      </DeckGL>


      {/* Logos institucionales */}
      {!showIntro && (
      <div 
        className="absolute top-8 pointer-events-none transition-all duration-300"
        style={{
          left: isPanelCollapsed ? 16 : PANEL_W + 16
        }}
      >
        {showAmozoc ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-5 py-3">
            <h2 className="text-lg font-bold text-gray-900">Caso Amozoc</h2>
            <p className="text-xs text-gray-500 mt-0.5">Vista municipal aislada</p>
          </div>
        ) : (
          <img src={logoLAF} alt="LAF" className="h-20" />
        )}
      </div>
      )}

      {!showIntro && (
      <div className="absolute top-8 right-8 flex items-start gap-3">
        <img
          src={logoIbero}
          alt="IBERO Puebla"
          className="h-14 pointer-events-none"
        />

        {/* ? button (hidden during Amozoc mode) */}
        {!showAmozoc && (
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button
              onClick={enterInfoMode}
              title="Información sobre corredores"
              className="w-8 h-8 bg-white/90 hover:bg-white text-gray-700 text-sm font-bold rounded-full shadow-lg transition-colors border border-gray-200 flex items-center justify-center cursor-pointer"
            >
              ?
            </button>
          </div>
        )}

        {/* Back button during Amozoc mode */}
        {showAmozoc && (
          <button
            onClick={exitAmozocMode}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium rounded-lg shadow-lg transition-colors border border-gray-200 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Volver al mapa
          </button>
        )}

        <div className="flex flex-col gap-2 pointer-events-auto">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setShowAdmin(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium rounded-lg shadow-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.295a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.416l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.416.587l-.295 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.416-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.416l-1.473-.295A1 1 0 0 1 1 10.68V9.32a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 3.03l1.25.834a6.957 6.957 0 0 1 1.416-.587l.294-1.473ZM13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd" />
                </svg>
                Admin
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700/80 hover:bg-red-700 text-white text-xs font-medium rounded-lg shadow-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
                </svg>
                Salir
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium rounded-lg shadow-lg transition-colors border border-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6 10a.75.75 0 0 1 .75-.75h9.546l-1.048-.943a.75.75 0 1 1 1.004-1.114l2.5 2.25a.75.75 0 0 1 0 1.114l-2.5 2.25a.75.75 0 1 1-1.004-1.114l1.048-.943H6.75A.75.75 0 0 1 6 10Z" clipRule="evenodd" />
              </svg>
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      )}

      {/* Controles del mapa (ocultos en pantalla intro) */}
      {!showIntro && (<>

      {/* Botones de control */}
      <div 
        className='absolute flex flex-col gap-2 transition-all duration-300'
        style={{
          left: isPanelCollapsed ? 16 : PANEL_W + 16,
          bottom: '140px'
        }}
      >
        <button
          className='px-2 py-2 bg-white cursor-pointer font-semibold text-black rounded-lg'
          onClick={() => {
            setIs3D((prev) => {
              const next = !prev;
              if (next) {
                // Puebla coordinates for 3D, pitch 45
                setViewState({
                  longitude: -98.206272,
                  latitude: 19.041297,
                  zoom: 9,
                  bearing: 0,
                  pitch: 45
                });
              } else {
                // Mantener vista actual pero pitch 0
                setViewState((vs) => ({
                  ...vs,
                  pitch: 0
                }));
              }
              return next;
            });
            setMapStyle(0);
          }}
        >
          {is3D ? 'Ver en 2D' : 'Ver en 3D'}
        </button>
        <button
          className='px-4 py-2 bg-white cursor-pointer font-semibold text-black rounded-lg'
          onClick={onChangeMap}
        >
          Cambiar mapa
        </button>
      </div>

      {/* Timeline inferior / Amozoc bar */}
      {showAmozoc ? (
        <AmozocTimelineBar panelWidth={isPanelCollapsed ? 0 : PANEL_W} />
      ) : allYears.length > 0 && yearRange && (
        <Timeline
          years={allYears}
          range={yearRange}
          onChange={(min: number, max: number) => setYearRange([min, max])}
          totalFosas={filteredFosas.length}
          totalMasacres={filteredMasacres.length}
          panelWidth={isPanelCollapsed ? 0 : PANEL_W}
        />
      )}

      {/* Leyenda de modalidades (solo visible cuando hay filtros de modalidad) */}
      {modalidadesInfo.length > 0 && (
        <ModalidadLegend modalidades={modalidadesInfo} />
      )}
      </>)}

      {/* Pantalla introductoria de Corredores */}
      {showIntro && (
        <CorredoresIntro
          onEnterMap={() => {
            setShowIntro(false);
            const saved = savedStateRef.current;
            if (saved) {
              setActiveLayers(saved.activeLayers);
              setFilters(saved.filters);
              setViewState({ ...saved.viewState, transitionDuration: 1200, transitionInterpolator: new FlyToInterpolator() });
              savedStateRef.current = null;
            }
          }}
        />
      )}

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* Admin Panel */}
      {showAdmin && isAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          uploadedCSVs={uploadedCSVs}
          onCSVUpload={handleCSVUpload}
          onCSVRemove={handleCSVRemove}
        />
      )}
      
    </div>
  );
}

export default Root;