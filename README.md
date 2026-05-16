# LAF — Laboratorio de Arquitectura Forense
### Plataforma de visualización geoespacial · IBERO Puebla
### Pablo Urbina Macip

Aplicación web interactiva para el análisis de fosas clandestinas, desapariciones forzadas y violencia en Puebla, México. Construida con React + TypeScript sobre el motor de renderizado WebGL [deck.gl](https://deck.gl/).

---

## Tabla de contenidos

1. [¿Qué hace esta aplicación?](#1-qué-hace-esta-aplicación)
2. [Instalación y arranque](#2-instalación-y-arranque)
3. [Estructura de archivos](#3-estructura-de-archivos)
4. [Arquitectura y flujo de datos](#4-arquitectura-y-flujo-de-datos)
5. [Componentes UI](#5-componentes-ui)
6. [Capas de visualización (layers)](#6-capas-de-visualización-layers)
7. [Hooks de datos](#7-hooks-de-datos)
8. [Datos y formatos CSV](#8-datos-y-formatos-csv)
9. [Sistema de autenticación](#9-sistema-de-autenticación)
10. [Despliegue (Vercel)](#10-despliegue-vercel)
11. [Actualizar o agregar datos](#11-actualizar-o-agregar-datos)
12. [Dependencias principales](#12-dependencias-principales)
13. [Solución de problemas comunes](#13-solución-de-problemas-comunes)

---

## 1. ¿Qué hace esta aplicación?

**En lenguaje común:** Es un mapa interactivo que muestra dónde se han encontrado fosas clandestinas y masacres en Puebla. El usuario puede filtrar por año, municipio, tipo de hallazgo, y ver estadísticas por zona mediante gráficas. También permite explorar corredores socios-territoriales con datos de desapariciones y delitos por municipio.

**En lenguaje técnico:** SPA (Single Page Application) React 19 + TypeScript que usa deck.gl v9 (WebGL) para renderizar capas geoespaciales sobre teselas XYZ. Los datos vienen de CSVs locales parseados con PapaParse y shapefiles (`.shp` + `.dbf`) cargados con la librería `shapefile` y reproyectados de ITRF2008/LCC a WGS84 con `proj4`. El estado de la aplicación vive en `App.tsx` y se pasa hacia abajo; toda la lógica de filtrado usa `useMemo` para evitar recálculos.

### Funcionalidades principales

| Funcionalidad | Descripción técnica |
|---|---|
| Mapa 2D / 3D | Alterna entre vista plana y `TerrainLayer` con elevación DEM |
| 7 mapas base | Cicla entre URLs de teselas XYZ (ESRI, CartoDB, OSM) |
| Fosas clandestinas | `ScatterplotLayer` sobre datos CSV, con filtros multidimensionales |
| Masacres | `ScatterplotLayer` independiente con sus propios filtros |
| Corredores socios-territoriales | Shapefiles reproyectados en `GeoJsonLayer`, lazy-loaded |
| Desapariciones por municipio | Polígonos de municipios coloreados por tasa/100k usando gradiente de color |
| Delitos por municipio | Hasta 5 categorías × N tipos, cada una en su `GeoJsonLayer` |
| Línea de tiempo | Control de rango `[año inicio, año fin]` que reactiva todos los `useMemo` de filtrado |
| Panel de filtros | Filtros por municipio, modalidad, hallazgo y texto libre |
| Polígono convex hull | Se dibuja automáticamente al activar filtros sobre los puntos visibles |
| Gráficas estadísticas | Modal flotante draggable y resizable con barras + acumulado + varianza (σ²) |
| Panel Amozoc | Modo especial con línea de tiempo propia y capa destacada de Amozoc |
| Admin Panel | Subida de CSVs en tiempo real (solo usuarios autenticados) |

---

## 2. Instalación y arranque

### Requisitos
- **Node.js** ≥ 20.19 (LTS recomendado)
- **npm** ≥ 10

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Puma120/LAF_Mapa.git
cd LAF_Mapa

# 2. Instalar dependencias
npm install

# 3. Servidor de desarrollo (http://localhost:5174)
npm run dev

# 4. Build de producción
npm run build

# 5. Preview del build local
npm run preview
```

### Variables de entorno

No se requieren variables de entorno. Los datos están en `/public/CSVs/` y `/src/assets/`. La única URL externa en tiempo de ejecución es la API de elevaciones `https://api-laf.vercel.app`.

---

## 3. Estructura de archivos

```
LAF-Pagina/
│
├── public/                          # Archivos estáticos (servidos tal cual)
│   ├── corredores/
│   │   └── centro-oriente.json      # GeoJSON de la línea del corredor Centro-Oriente
│   ├── CSVs/
│   │   ├── Base_Desap_TasaValores.csv   # Desapariciones por municipio y año
│   │   └── CSVDelitos_CORR_CEN_NUEVO.csv # Delitos del corredor Centro
│   ├── Desap2014/                   # Shapefile del corredor (polígonos municipios filtrados)
│   │   └── DESAP2014- TEST28ene.*   # .shp, .dbf, .prj, .shx, .sbn, .sbx
│   ├── Homicidio_Doloso/            # Shapefile de homicidio doloso (no en uso activo)
│   └── ShapesBase_Puebla/
│       └── 21mun.*                  # Shapefile con los 217 municipios de Puebla
│
├── src/
│   ├── main.tsx                     # Punto de entrada — monta <App> con <AuthProvider>
│   ├── index.css                    # Estilos globales (Tailwind + overrides)
│   ├── vite-env.d.ts                # Tipos de Vite (import.meta.env, etc.)
│   │
│   ├── App.tsx                      # ★ Componente raíz — todo el estado vive aquí
│   │
│   ├── assets/                      # Archivos importados por Vite (bundle)
│   │   ├── Fosas_clandestinas_2.csv # Dataset de fosas (respaldo)
│   │   ├── Fosas_clandestinas_3.csv # Dataset de fosas (principal, más reciente)
│   │   ├── Base de Datos - Masacres (1).csv
│   │   ├── Fosas_nuevas.csv         # Fosas adicionales (integradas en el hook)
│   │   ├── Logo-LAF-Blanco.png
│   │   ├── Logo-LAF-Negro.png
│   │   └── Logo-Ibero.png
│   │
│   ├── components/                  # Componentes React (solo UI, sin lógica de datos)
│   │   ├── WelcomeScreen.tsx        # Pantalla de bienvenida inicial
│   │   ├── CorredoresIntro.tsx      # Intro animada del modo corredores
│   │   ├── UnifiedFilterPanel.tsx   # ★ Panel lateral de filtros y resultados
│   │   ├── Timeline.tsx             # Barra de línea de tiempo con rango de años
│   │   ├── FosaPopup.tsx            # Popup sobre el mapa al hacer click en fosa
│   │   ├── FosaDetailModal.tsx      # Modal de detalle completo de una fosa
│   │   ├── MasacrePopup.tsx         # Popup al hacer click en masacre
│   │   ├── MasacreDetailModal.tsx   # Modal de detalle completo de una masacre
│   │   ├── MunicipioPopup.tsx       # Popup al hacer click en polígono de municipio
│   │   ├── ChartsModal.tsx          # ★ Modal flotante de gráficas (draggable + resizable)
│   │   ├── ModalidadLegend.tsx      # Leyenda de modalidades de fosa (sobre el mapa)
│   │   ├── LayerSelector.tsx        # Selector flotante de capas (botón "Capas de Polígonos")
│   │   ├── FilterPanel.tsx          # Panel de filtros legacy (no en uso activo)
│   │   ├── Compass.tsx              # Brújula visual en la esquina del mapa
│   │   ├── AmozocPanel.tsx          # Panel lateral del caso Amozoc
│   │   ├── AmozocTimelineBar.tsx    # Línea de tiempo específica del caso Amozoc
│   │   ├── LoginModal.tsx           # Modal de inicio de sesión
│   │   └── AdminPanel.tsx           # Panel de administración (upload CSVs)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx          # Contexto de autenticación (usuarios mock + localStorage)
│   │
│   ├── hooks/                       # Custom hooks — lógica de carga de datos
│   │   ├── useFosasData.ts          # Carga y parsea Fosas_clandestinas_*.csv
│   │   ├── useMasacresData.ts       # Carga y parsea el CSV de masacres
│   │   ├── useDesapData.ts          # Carga Base_Desap_TasaValores.csv (fetch en /public)
│   │   ├── useDelitosData.ts        # Carga CSVDelitos_CORR_CEN_NUEVO.csv
│   │   ├── useShapefileLoader.ts    # Carga shapefiles (.shp + .dbf) y los reproyecta
│   │   └── useMunicipiosShape.ts    # Wrapper específico para municipios (no activo)
│   │
│   ├── layers/                      # Funciones que crean capas deck.gl (sin estado React)
│   │   ├── FosasLayer.ts            # ScatterplotLayer + PolygonLayer (modalidad + convex hull)
│   │   ├── MasacresLayer.ts         # ScatterplotLayer de masacres
│   │   ├── MunicipiosLayer.ts       # GeoJsonLayer con colores por índice
│   │   ├── ShapeLayer.ts            # GeoJsonLayer genérico para shapefiles (con intensidad)
│   │   └── CorredorLineLayer.ts     # GeoJsonLayer de línea del corredor (desde GeoJSON)
│   │
│   └── types/
│       └── shapefile.d.ts           # Declaraciones de tipos para la librería `shapefile`
│
├── index.html                       # HTML base (Vite inyecta el bundle aquí)
├── vite.config.ts                   # Configuración de Vite (plugins: react + tailwindcss)
├── tsconfig.json                    # TypeScript base
├── tsconfig.app.json                # TypeScript para el código fuente
├── tsconfig.node.json               # TypeScript para vite.config.ts
├── eslint.config.js                 # Reglas de ESLint
└── package.json                     # Dependencias y scripts npm
```

---

## 4. Arquitectura y flujo de datos

### Diagrama simplificado

```
CSV / Shapefile
     │
     ▼
 Hooks (useFosasData, useDesapData, etc.)
     │  parsean y normalizan en estructuras TypeScript
     ▼
App.tsx  ──  todo el estado vive aquí
     │
     ├── filteredFosas / filteredMasacres  (useMemo sobre filters + yearRange)
     │
     ├── layers  (useMemo → array de capas deck.gl)
     │        └── pasa a <DeckGL layers={layers} />
     │
     ├── UnifiedFilterPanel  (recibe filters, llama onChange)
     ├── Timeline             (recibe yearRange, llama onYearRangeChange)
     ├── Popups               (FosaPopup, MasacrePopup, MunicipioPopup)
     └── ChartsModal          (recibe popupChartData, reactivo a yearRange)
```

### Principio de estado centralizado

Todo el estado relevante (filtros, capas activas, viewState, año, feature seleccionada) vive en `App.tsx`. Los componentes hijos **no tienen estado propio** de datos — reciben todo como props y devuelven eventos hacia arriba mediante callbacks.

### Reactividad del año

`yearRange: [number, number] | null` es el estado que controla la línea de tiempo. Dos `useMemo` lo consumen directamente:
- `filteredFosas` y `filteredMasacres` — filtra puntos por año del registro
- `popupChartData` — regenera los datos de la gráfica activa

### Lazy loading de shapefiles

Los shapefiles solo se cargan cuando la capa correspondiente está activa (`activeLayers` incluye su ID). Cada `useShapefileLoader` comprueba `enabled` y no hace ningún fetch si es `false`. Una vez cargado, el resultado se mantiene en el estado del hook (no se recarga al desactivar y reactivar).

---

## 5. Componentes UI

### `App.tsx` — Componente raíz

Contiene todo el estado. Renderiza el canvas `<DeckGL>` y todos los componentes superpuestos mediante divs posicionados con `position: fixed` o `absolute`. Los popups de deck.gl se proyectan con `WebMercatorViewport.project()` para convertir coordenadas geográficas a píxeles de pantalla.

### `UnifiedFilterPanel.tsx`

Panel lateral izquierdo (~270px). Organizado en secciones:
- **Mostrar geolocalizaciones**: checkboxes para Fosas y Masacres
- **Búsqueda por municipio**: texto libre que busca en todos los campos del registro
- **Caso Amozoc**: botón de entrada al modo especial
- **Seleccionar corredores**: lista de capas de shapefiles con jerarquía (capa padre → subcapas → categorías de delito → tipos de delito)
- **Resultados**: lista scrolleable de los registros filtrados, con pestañas Fosas / Masacres

Al desactivar una capa padre, `onToggleLayer` en `App.tsx` elimina automáticamente todas las subcapas (hijos por `parentId`) y todos los `delito_*` si el padre es `homicidio_doloso`.

### `ChartsModal.tsx`

Modal flotante que aparece al hacer click en "Ver gráfica" dentro de un popup de municipio. Características:
- **Draggable**: arrastrar por el encabezado mueve el modal
- **Resizable**: esquina inferior derecha para redimensionar
- **Reactivo**: se recalcula automáticamente cuando cambia `yearRange` o se hace click en otro municipio
- **Tipos de gráfica**: barras por año con línea de acumulado y tarjetas de estadísticas (total, máximo, mínimo, varianza σ²)

### `Timeline.tsx`

Barra horizontal en la parte inferior. Permite seleccionar un rango de años con dos handles arrastrables. El estado `yearRange` en `App.tsx` se actualiza en tiempo real (con debounce para la capa intensiva de shapefiles).

---

## 6. Capas de visualización (layers)

Todas las capas son funciones puras en `src/layers/` que reciben datos y opciones, y devuelven instancias de capas deck.gl. No tienen estado React.

### `FosasLayer.ts`

| Función | Capa deck.gl | Descripción |
|---|---|---|
| `createFosasLayer(fosas)` | `ScatterplotLayer` | Puntos rojos con borde blanco, tamaño constante en pantalla |
| `createModalidadPolygons(fosas)` | `PolygonLayer` | Convex hull por modalidad, cada una en un color distinto |
| `createSearchPolygon(points)` | `PolygonLayer` | Convex hull único sobre todos los puntos filtrados (amarillo translúcido) |
| `getModalidadesWithColors(fosas)` | — | Retorna metadata de modalidades para la leyenda |

### `MasacresLayer.ts`

`createMasacresLayer(masacres)` → `ScatterplotLayer` con puntos morados.

### `ShapeLayer.ts`

`createShapeLayer(id, features, config, options)` → `GeoJsonLayer` con dos modos:
- **Color sólido** (`config.color` definido): todos los polígonos del mismo color
- **Intensidad** (capas de desapariciones o delitos): el color de cada polígono varía con un gradiente según el valor para el año del rango seleccionado (blanco → rojo o color de categoría según el tipo de capa)

### `MunicipiosLayer.ts`

`createMunicipiosLayer(municipios, options)` → `GeoJsonLayer` con colores por índice de una paleta predefinida. Se usa para la capa base de municipios cuando no hay datos de intensidad.

### `CorredorLineLayer.ts`

`createCorredorLineLayer(config, data)` → `GeoJsonLayer` con `filled: false` para dibujar solo la línea del corredor sobre los polígonos. El GeoJSON fuente está en `/public/corredores/centro-oriente.json`.

---

## 7. Hooks de datos

### `useFosasData`

- **Fuente**: `src/assets/Fosas_clandestinas_3.csv` (principal) con fallback a `_2.csv` después de 1.5s si el primero no carga
- **Retorna**: `{ fosas: FosaRecord[] }` donde cada registro tiene `position: [lon, lat]` y `raw: Record<string, any>` con todas las columnas originales
- **Normaliza coordenadas**: acepta decimal, grados-minutos-segundos (`D°M'S"`) y formato con puntos

### `useMasacresData`

- **Fuente**: `src/assets/Base de Datos - Masacres (1).csv`
- **Retorna**: `{ masacres: MasacreRecord[] }`

### `useDesapData(enabled)`

- **Fuente**: `/public/CSVs/Base_Desap_TasaValores.csv` (fetch en tiempo de ejecución)
- **Retorna**: `{ data: Map<CVEGEO, DesapMunicipioData>, loading, years }`
- `CVEGEO` es la clave de municipio que coincide con el shapefile de Puebla
- Solo carga cuando `enabled = true` (lazy)

### `useDelitosData(enabled)`

- **Fuente**: `/public/CSVs/CSVDelitos_CORR_CEN_NUEVO.csv`
- **Retorna**: `{ records: DelitoRecord[], categorias: DelitoCategoriaInfo[], loading }`
- `categorias` agrupa los tipos de delito en 5 categorías con colores predefinidos (vulneración de vida, libertad, sexual, extracción de recursos, drogas/armas)

### `useShapefileLoader(config, enabled)`

- Carga archivos `.shp` + `.dbf` desde `/public/` via `fetch`
- Decodifica con encoding `latin1` para caracteres en español
- Reproyecta de **ITRF2008/LCC** (sistema catastral mexicano) a **WGS84** usando `proj4`
- Filtra features por `config.filterField` + `config.filterValues` si están definidos
- **`LAYER_CONFIGS`**: array exportado con la configuración de las 5 capas disponibles:

| ID | Nombre | Shapefile | Descripción |
|---|---|---|---|
| `municipios` | Municipios de Puebla | `ShapesBase_Puebla/21mun` | 217 municipios, polígonos base |
| `corredor` | Corredor Centro-Oriente | `Desap2014/DESAP2014-TEST28ene` | Filtrado a municipios del corredor |
| `desapariciones` | Desapariciones por Municipio | `ShapesBase_Puebla/21mun` | Misma geometría, coloreada por tasa de desapariciones |
| `desapariciones_corredor` | Desapariciones (corredor) | `Desap2014/DESAP2014-TEST28ene` | Desapariciones solo en municipios del corredor |
| `homicidio_doloso` | Corredor Centro | `ShapesBase_Puebla/21mun` | Filtrado a municipios del corredor Centro |

---

## 8. Datos y formatos CSV

### Fosas clandestinas (`Fosas_clandestinas_3.csv`)

Columnas requeridas:

| Columna | Descripción |
|---|---|
| `Coord_Y` / `Y` / `lat` | Latitud (decimal o DMS) |
| `Coord_X` / `X` / `lon` | Longitud (decimal o DMS) |
| `AÑO` / `Anio` | Año del hallazgo |
| `MUNICIPIO` | Nombre del municipio |
| `MODALIDAD DE FOSA` | Tipo de fosa (PRIMARIA, SECUNDARIA, etc.) |
| `QUIÉN HIZO EL HALLAZGO` | Responsable del hallazgo (normalizado en el hook) |
| `ZONA` | Zona geográfica |

El hook acepta múltiples variantes de nombre de columna para mayor robustez.

### Desapariciones (`Base_Desap_TasaValores.csv`)

| Columna | Descripción |
|---|---|
| `CVEGEO` | Clave de municipio (debe coincidir con shapefile) |
| `NOMGEO` | Nombre del municipio |
| `Anio` | Año |
| `Total` | Total de desapariciones |
| `Hombres` / `Mujeres` | Desagregado por sexo |
| `Poblacion` | Población para calcular tasa |
| `TASA_100K` | Tasa por 100,000 habitantes |

### Delitos (`CSVDelitos_CORR_CEN_NUEVO.csv`)

| Columna | Descripción |
|---|---|
| `CVEGEO` | Clave de municipio |
| `NOMGEO` | Nombre del municipio |
| `ANIO` | Año |
| `TIPO_DE_DELITO` | Nombre del tipo de delito |
| `ID_Categoria` | Número de categoría (1–5) |
| `CATEGORIA` | Nombre de la categoría |
| `INCIDENCIA` | Número de casos |
| `POBLACION` | Población del municipio |
| `TASA` | Tasa por 100,000 habitantes |

---

## 9. Sistema de autenticación

La autenticación está implementada en `src/contexts/AuthContext.tsx` con usuarios hardcodeados (mock). La sesión se persiste en `localStorage` bajo la clave `laf_user`.

**Usuarios actuales:**

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `laf2024` | admin |
| `investigador` | `ibero2024` | admin |

> ⚠️ **Para producción real**: reemplazar `MOCK_USERS` con llamadas a una API segura. Las contraseñas actuales están en texto plano en el código fuente — no usar en entornos con datos sensibles sin antes migrar a autenticación real.

El rol `admin` habilita el `AdminPanel` que permite subir CSVs en tiempo de ejecución para superponerlos sobre las capas existentes.

---

## 10. Despliegue (Vercel)

El proyecto se despliega automáticamente en [Vercel](https://vercel.com/) desde la rama `main` del repositorio `Puma120/LAF_Mapa`.

El build corre `tsc -b && vite build`. Para que pase:
- No debe haber errores de TypeScript (`tsc -b`)
- Los archivos en `public/` se sirven tal cual en la raíz del dominio
- Los assets en `src/assets/` se incluyen en el bundle de Vite

Para hacer deploy manual:
```bash
npm run build   # verifica localmente antes de push
git push origin main
```

---

## 11. Actualizar o agregar datos

### Reemplazar el CSV de fosas

1. Nombrar el archivo `Fosas_clandestinas_3.csv` (o ajustar el nombre en `useFosasData.ts`)
2. Colocar en `src/assets/`
3. Verificar que tenga columnas `Coord_Y`, `Coord_X` y `AÑO` (o sus variantes)

### Agregar un nuevo corredor (shapefile)

1. Copiar los archivos `.shp`, `.dbf`, `.prj` a `/public/`
2. Agregar una entrada en `LAYER_CONFIGS` dentro de `src/hooks/useShapefileLoader.ts`:

```ts
{
  id: 'mi_corredor',
  name: 'Nombre visible',
  basePath: '/MiCarpeta',
  fileName: 'mi_archivo',
  color: [100, 200, 100, 80],
  strokeColor: [100, 200, 100, 200],
  filterField: 'NOMGEO',           // opcional: columna por la que filtrar
  filterValues: ['MUNICIPIO A'],   // opcional: valores permitidos
  parentId: 'corredor',            // opcional: ID del padre para submenú
}
```

3. Agregar la llamada a `useShapefileLoader` en `App.tsx` siguiendo el patrón existente.

### Agregar la línea visual de un corredor

Editar o agregar un GeoJSON con geometría `LineString` en `/public/corredores/` y registrarlo en `CORREDOR_LINES` dentro de `src/layers/CorredorLineLayer.ts`.

### Actualizar el CSV de desapariciones o delitos

Reemplazar los archivos en `/public/CSVs/`. Mantener exactamente los mismos nombres de columna. Si cambian los nombres, actualizar los accesos en `useDesapData.ts` o `useDelitosData.ts` respectivamente.

---

## 12. Dependencias principales

| Paquete | Versión | Para qué se usa |
|---|---|---|
| `react` + `react-dom` | 19 | Framework UI |
| `deck.gl` | 9 | Motor de renderizado WebGL del mapa |
| `@deck.gl/core` | 9 | `FlyToInterpolator`, `WebMercatorViewport` |
| `@deck.gl/layers` | 9 | `BitmapLayer`, `ScatterplotLayer`, `PolygonLayer`, `GeoJsonLayer` |
| `@deck.gl/geo-layers` | 9 | `TileLayer` (mapas base), `TerrainLayer` (3D) |
| `@deck.gl/react` | 9 | Componente `<DeckGL>` |
| `@deck.gl/widgets` | 9 | Solo el CSS del stylesheet (`@deck.gl/widgets/stylesheet.css`) |
| `@turf/turf` | 7 | `bbox` y `centroid` para calcular zoom automático al filtrar |
| `papaparse` | 5 | Parseo de CSVs de fosas y masacres |
| `shapefile` | 0.6 | Lectura de archivos `.shp` + `.dbf` |
| `proj4` | 2 | Reproyección ITRF2008/LCC → WGS84 |
| `tailwindcss` | 4 | Estilos (via `@tailwindcss/vite`) |

---

## 13. Solución de problemas comunes

### El mapa no carga / aparece en blanco
- Verificar consola del navegador. Generalmente es un error de CORS al cargar teselas de un mapa base.
- Probar con otro mapa base (botón "Cambiar mapa").

### Las fosas no aparecen
- Verificar que el CSV tenga columnas de coordenadas reconocibles (`Coord_Y`, `Coord_X`).
- Abrir la consola: el hook imprime cuántos registros se cargaron.
- Asegurarse de que el checkbox "Fosas Clandestinas" esté marcado.

### Un shapefile no carga
- Confirmar que tanto `.shp` como `.dbf` estén en `/public/` con exactamente el nombre definido en `LAYER_CONFIGS.fileName`.
- Verificar el encoding: el hook intenta UTF-8 y si hay caracteres corruptos reintenta con `latin1`.

### El build falla con errores TS6133 (variable declarada pero no usada)
- Prefijar la variable con `_` (ej: `_fillColor`) para indicar a TypeScript que es intencional.

### Los años 20XX no aparecen en la línea de tiempo
- El hook genera un rango continuo de `minAño` a `maxAño`. Si un año intermedio no tiene datos en el CSV, de todas formas aparece en la línea de tiempo con valor 0.
- Verificar que el campo año no tenga formato `"2014.0"` — el código lo normaliza con `.replace(/\.0+$/, '')` pero si el campo cambia de nombre puede no aplicarse.

### Vercel muestra "Build Failed"
1. Correr `npm run build` localmente primero
2. Revisar errores de TypeScript en la salida
3. Confirmar que el commit esté en la rama `main` del repositorio correcto
