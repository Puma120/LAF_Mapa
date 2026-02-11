// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// https://github.com/visgl/deck.gl/tree/9.1-release/examples/get-started/react
// https://d2ad6b4ur7yvpq.cloudfront.net

import { useEffect, useState, useMemo, useCallback } from 'react';
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
import LayerSelector from './components/LayerSelector';
import { createFosasLayer, createModalidadPolygons, getModalidadesWithColors } from './layers/FosasLayer';
import { createMasacresLayer } from './layers/MasacresLayer';
import { createShapeLayer } from './layers/ShapeLayer';
import { useFosasData } from './hooks/useFosasData';
import { useMasacresData, type MasacreRecord } from './hooks/useMasacresData';
import { useShapefileLoader, LAYER_CONFIGS, type ShapeFeature } from './hooks/useShapefileLoader';
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


const INITIAL_VIEW_STATE = {
  longitude: -102,
  latitude: 23,
  zoom: 5,
  bearing: 0,
  pitch: 0
};


function Root() {
  const [mapStyle, setMapStyle] = useState<number>(0);
  const { fosas } = useFosasData();
  const { masacres } = useMasacresData();
  
  // Cargar todas las capas de shapefiles
  const municipiosData = useShapefileLoader(LAYER_CONFIGS[0]);
  const corredorData = useShapefileLoader(LAYER_CONFIGS[1]);
  const homicidioDolosoData = useShapefileLoader(LAYER_CONFIGS[3]);
  
  // Cargar datos de desapariciones del CSV
  const desapCSV = useDesapData();
  
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
  
  // Estado de capas activas (ninguna activa al inicio)
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  
  // Map de datos de capas para fácil acceso
  const shapeLayersData: Record<string, { features: ShapeFeature[]; loading: boolean }> = {
    municipios: { features: municipiosData.features, loading: municipiosData.loading },
    corredor: { features: corredorData.features, loading: corredorData.loading },
    desapariciones: { features: desapFeatures, loading: municipiosData.loading || desapCSV.loading },
    homicidio_doloso: { features: homicidioDolosoData.features, loading: homicidioDolosoData.loading },
  };
  
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
    showFosas: true,
    showMasacres: true,
  });
  const [is3D, setIs3D] = useState<boolean>(false);
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

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

  // When yearRange changes, sync filters.anio with all years inside range
  useEffect(() => {
    if (!allYears.length || !yearRange) return;
    const [minY, maxY] = yearRange;
    const selectedYears = allYears.filter(y => y >= minY && y <= maxY).map(String);
    setFilters(prev => ({ ...prev, anio: selectedYears }));
  }, [yearRange, allYears]);

  // Calcular modalidades visibles para la leyenda
  const modalidadesInfo = useMemo(() => {
    if (filters.modalidad.length === 0) return [];
    return getModalidadesWithColors(filteredFosas);
  }, [filteredFosas, filters.modalidad]);

  
  const layers = useMemo(() => {
    const baseLayers: any[] = [
      new TileLayer({
        id: "tile-layer",
        minZoom: 0,
        maxZoom: 18,
        tileSize: 256,
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
            // Pasar yearRange para capas con datos de desapariciones
            yearRange: (config.id === 'corredor' || config.id === 'desapariciones') ? yearRange : null,
            onClick: (info: any) => {
              if (info?.object?.properties) {
                setSelectedFeature({ 
                  type: 'municipio', 
                  properties: info.object.properties as MunicipioProperties 
                });
              }
            },
          }));
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
  }, [mapStyle, filteredFosas, filteredMasacres, renderTileSubLayers, is3D, filters.modalidad, filters.showFosas, filters.showMasacres, activeLayers, shapeLayersData, yearRange]);
    

  return (
    <div>
      <DeckGL
        pickingRadius={12}
        controller={{
          inertia: 150, // Reducido de 250
          scrollZoom: {speed: 0.01, smooth: false}, // Aumentado speed y desactivado smooth
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
        />

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
      <div 
        className="absolute top-8 pointer-events-none transition-all duration-300"
        style={{
          left: isPanelCollapsed ? '80px' : '328px'
        }}
      >
        <img
          src={logoLAF}
          alt="LAF"
          className="h-20"
        />
      </div>

      {/* Logo superior derecho */}
      <div className="absolute top-8 right-8 pointer-events-none">
        <img
          src={logoIbero}
          alt="IBERO Puebla"
          className="h-14"
        />
      </div>

      {/* Leyenda del mapa */}
      <div 
        className="absolute bg-white rounded-lg shadow-lg p-3 pointer-events-auto transition-all duration-300" 
        style={{ 
          zIndex: 1001,
          left: isPanelCollapsed ? '80px' : '328px',
          bottom: '280px'
        }}
      >
        <div className="text-sm font-semibold mb-2 text-gray-800">Leyenda</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-700"></div>
            <span className="text-xs text-gray-700">Fosas Clandestinas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgb(155, 89, 182)', border: '2px solid rgb(75, 0, 130)' }}></div>
            <span className="text-xs text-gray-700">Masacres</span>
          </div>
          {/* Mostrar capas activas en la leyenda */}
          {LAYER_CONFIGS.filter(c => activeLayers.includes(c.id)).map(config => (
            <div key={config.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ 
                  backgroundColor: config.color 
                    ? `rgba(${config.color[0]}, ${config.color[1]}, ${config.color[2]}, 0.5)` 
                    : 'rgba(65, 105, 225, 0.5)', 
                  border: config.strokeColor 
                    ? `2px solid rgba(${config.strokeColor[0]}, ${config.strokeColor[1]}, ${config.strokeColor[2]}, 0.8)` 
                    : '2px solid rgba(65, 105, 225, 0.8)' 
                }}
              ></div>
              <span className="text-xs text-gray-700">{config.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selector de capas de polígonos */}
      <LayerSelector
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
      />

      {/* Botones de control */}
      <div 
        className='absolute flex flex-col gap-2 transition-all duration-300'
        style={{
          left: isPanelCollapsed ? '80px' : '328px',
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

      {/* Timeline inferior */}
      {allYears.length > 0 && yearRange && (
        <Timeline
          years={allYears}
          range={yearRange}
          onChange={(min: number, max: number) => setYearRange([min, max])}
          totalFosas={filteredFosas.length}
          totalMasacres={filteredMasacres.length}
        />
      )}

      {/* Leyenda de modalidades (solo visible cuando hay filtros de modalidad) */}
      {modalidadesInfo.length > 0 && (
        <ModalidadLegend modalidades={modalidadesInfo} />
      )}
      
    </div>
  );
}

export default Root;