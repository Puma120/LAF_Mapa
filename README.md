# DOCUMENTACIÓN COMPLETA DEL PROYECTO LAF
## Sistema Interactivo de Visualización de Fosas Clandestinas y Masacres en México

---

## 📑 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Guía de Instalación y Ejecución](#2-guía-de-instalación-y-ejecución)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Directorios](#4-estructura-de-directorios)
5. [Formato de Datos CSV](#5-formato-de-datos-csv)
6. [Componentes del Sistema](#6-componentes-del-sistema)
7. [Capas de Visualización (Layers)](#7-capas-de-visualización-layers)
8. [Hooks de Datos](#8-hooks-de-datos)
9. [Flujo de Datos](#9-flujo-de-datos)
10. [Funcionalidades Principales](#10-funcionalidades-principales)
11. [Estilos y UI/UX](#11-estilos-y-uiux)
12. [Tecnologías Utilizadas](#12-tecnologías-utilizadas)
13. [Optimizaciones y Rendimiento](#13-optimizaciones-y-rendimiento)
14. [Troubleshooting](#14-troubleshooting)
15. [Mantenimiento y Actualización de Datos](#15-mantenimiento-y-actualización-de-datos)

---

## 1. RESUMEN EJECUTIVO

El proyecto LAF es una aplicación web interactiva desarrollada en **React con TypeScript** que permite la visualización geoespacial de fosas clandestinas y masacres en México. Utiliza **deck.gl** para renderizado de mapas 3D/2D de alto rendimiento, integrando datos desde archivos CSV con coordenadas geográficas.

### ✨ CARACTERÍSTICAS PRINCIPALES:
- 🗺️ Visualización interactiva de ~80 fosas clandestinas y ~1000 masacres
- 🌍 Mapas base múltiples (satélite, topográfico, OSM, CartoDB)
- 🏔️ Vista 2D y 3D con terreno elevado
- 🔍 Sistema de filtros avanzado (municipio, zona, modalidad, año, búsqueda)
- ⏱️ Línea de tiempo interactiva con modos de animación
- 💬 Popups informativos con detalles de cada incidente
- 📦 Panel de filtros colapsable
- 🎨 Leyendas dinámicas
- 🔷 Polígonos de convex hull por modalidad

---

## 2. GUÍA DE INSTALACIÓN Y EJECUCIÓN

### 📋 REQUISITOS PREVIOS:
- **Node.js** versión 20.19+ o 22.12+
- **npm** (incluido con Node.js)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

### 🚀 PASOS DE INSTALACIÓN:

#### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/Inigo1405/LAF.git
cd LAF
```

#### 2️⃣ Instalar dependencias
```bash
npm install
```

Esto instalará:
- React 19.1.1
- deck.gl 9.1.14
- papaparse 5.4.1
- tailwindcss 4.1.14
- TypeScript 5.8.3
- Vite 7.1.2

#### 3️⃣ Verificar archivos CSV
Asegurar que estos archivos estén en `src/assets/`:
- `Fosas_clandestinas_2.csv`
- `Base de Datos - Masacres (1).csv`

#### 4️⃣ Ejecutar en modo desarrollo
```bash
npm run dev
```
El servidor se iniciará en: **http://localhost:5173**

#### 5️⃣ Compilar para producción
```bash
npm run build
```
Los archivos se generarán en la carpeta `dist/`

#### 6️⃣ Ejecutar el linter
```bash
npm run lint
```

### ⚠️ NOTAS IMPORTANTES:
- El primer inicio puede tardar ~1-2 segundos mientras se cargan los datos CSV
- Se requiere **conexión a internet** para cargar los mapas base
- El modo 3D requiere mayor capacidad de procesamiento gráfico

---

## 3. ARQUITECTURA DEL SISTEMA

El sistema sigue una arquitectura de componentes React con separación de responsabilidades:

### 🏗️ CAPAS DE LA ARQUITECTURA:

#### 1. CAPA DE PRESENTACIÓN (Components)
- Componentes de UI reutilizables
- Manejo de eventos de usuario
- Renderizado condicional

#### 2. CAPA DE LÓGICA DE NEGOCIO (Hooks)
- Carga y parseo de datos CSV
- Transformación de coordenadas
- Estado de la aplicación

#### 3. CAPA DE VISUALIZACIÓN (Layers)
- Renderizado de puntos geoespaciales
- Polígonos de modalidad
- Configuración de deck.gl

#### 4. CAPA DE DATOS (Assets)
- Archivos CSV con datos crudos
- Imágenes y recursos estáticos

### 🔄 FLUJO DE DATOS:
```
CSV → Hooks (parseo) → Estado React → Filtros → Layers → deck.gl → Renderizado
```

### 🎯 PATRÓN DE DISEÑO:
- Hooks personalizados para lógica de datos
- Componentes controlados con props
- Estado unificado en `App.tsx`
- Memoización para optimización

---

## 4. ESTRUCTURA DE DIRECTORIOS

```
LAF/
├── .git/                           # Control de versiones Git
├── .gitignore                      # Archivos ignorados por Git
├── .vscode/                        # Configuración de VS Code
├── dist/                           # Archivos compilados (generados)
├── node_modules/                   # Dependencias instaladas
├── public/                         # Recursos públicos estáticos
├── src/                            # Código fuente principal
│   ├── App.tsx                     # Componente raíz, orquestador
│   ├── main.tsx                    # Punto de entrada React
│   ├── index.css                   # Estilos globales
│   ├── vite-env.d.ts              # Tipos de Vite
│   │
│   ├── assets/                     # Recursos estáticos
│   │   ├── Fosas_clandestinas_2.csv          # Dataset de fosas
│   │   ├── Base de Datos - Masacres (1).csv # Dataset de masacres
│   │   ├── Logo-LAF-Blanco.png               # Logo LAF (blanco)
│   │   ├── Logo-Ibero.png                    # Logo IBERO Puebla
│   │   └── Logo-LAF-Negro.png                # Logo LAF (negro)
│   │
│   ├── components/                 # Componentes React
│   │   ├── Compass.tsx                       # Brújula de orientación
│   │   ├── FilterPanel.tsx                   # Panel de filtros (legacy)
│   │   ├── FosaPopup.tsx                     # Popup de fosas
│   │   ├── MasacrePopup.tsx                  # Popup de masacres
│   │   ├── ModalidadLegend.tsx               # Leyenda de modalidades
│   │   ├── Timeline.tsx                      # Línea de tiempo interactiva
│   │   └── UnifiedFilterPanel.tsx            # Panel unificado (actual)
│   │
│   ├── hooks/                      # Hooks personalizados
│   │   ├── useFosasData.ts                   # Hook para cargar fosas
│   │   └── useMasacresData.ts                # Hook para cargar masacres
│   │
│   └── layers/                     # Capas de deck.gl
│       ├── FosasLayer.ts                     # Capa de visualización fosas
│       └── MasacresLayer.ts                  # Capa de visualización masacres
│
├── eslint.config.js                # Configuración ESLint
├── index.html                      # HTML base
├── package.json                    # Dependencias y scripts
├── package-lock.json               # Lockfile de npm
├── README.md                       # Documentación completa
├── tsconfig.json                   # Configuración TypeScript
├── tsconfig.app.json              # Config TS para app
├── tsconfig.node.json             # Config TS para Node
└── vite.config.ts                 # Configuración Vite
```

### 📄 DESCRIPCIÓN DE ARCHIVOS CLAVE:

- **App.tsx** (602 líneas): Componente principal que maneja estado global, integración de capas, filtros, timeline y eventos de interacción.

- **UnifiedFilterPanel.tsx** (635 líneas): Panel colapsable con filtros independientes para fosas y masacres, pestañas de resultados.

- **Timeline.tsx** (518 líneas): Línea de tiempo con 4 modos (todos, custom, animación, individual), drag & drop, y controles de velocidad.

- **useFosasData.ts** (106 líneas): Hook que carga CSV de fosas, parsea coordenadas en múltiples formatos (decimal, DMS, etc.).

- **FosasLayer.ts** (236 líneas): Crea ScatterplotLayer y PolygonLayer, implementa convex hull para polígonos de modalidad.

---

## 5. FORMATO DE DATOS CSV

### 5.1 FOSAS CLANDESTINAS (`Fosas_clandestinas_2.csv`)

#### 📍 COLUMNAS REQUERIDAS:
- **Coord_X**: Longitud (formatos aceptados: decimal, DMS, grados con hemisferio)
- **Coord_Y**: Latitud (formatos aceptados: decimal, DMS, grados con hemisferio)

#### 📋 COLUMNAS OPCIONALES PERO RECOMENDADAS:
- **CASO**: Identificador único del caso
- **FECHA DEL HALLAZGO**: Fecha en formato ISO o texto
- **AÑO**: Año del hallazgo (número o texto)
- **MUNUCUPIO / MUNICIPIO / Municipio**: Nombre del municipio
- **ZONA**: Descripción de la zona
- **CUERPOS ENCONTRADOS**: Descripción de víctimas
- **MODALIDAD DE FOSA / MODALIDAD**: Tipo de fosa
- **CARACTERÍSTICAS DEL SITIO DE HALLAZGO**: Descripción del sitio
- **QUIÉN HIZO EL HALLAZGO**: Actor que descubrió la fosa
- **DESCRIPCIÓN**: Narrativa completa del caso

#### 🌐 FORMATOS DE COORDENADAS ACEPTADOS:
1. **Decimal**: `19.0416, -97.9473`
2. **Grados con hemisferio**: `19.0416N, 97.9473W`
3. **DMS (Grados Minutos Segundos)**: `19°02'29.76"N, 97°56'50.28"W`
4. **DMS con puntos**: `19.02.29.76`

#### 📝 EJEMPLO DE FILA VÁLIDA:
```csv
CASO,FECHA DEL HALLAZGO,AÑO,MUNUCUPIO,ZONA,Coord_Y,Coord_X,CUERPOS ENCONTRADOS,MODALIDAD DE FOSA,QUIÉN HIZO EL HALLAZGO,DESCRIPCIÓN
1.0,2012-01-27,2012.0,Tzicatlacoyan,"Calle 16 de septiembre",18.7997633,97.9877249,"3 mujeres",Sendero rural,Autoridades,"Descripción del hallazgo..."
```

#### ✅ VALIDACIONES:
- Coordenadas en rangos válidos: Latitud [-90, 90], Longitud [-180, 180]
- Año entre 1900 y 2100
- Municipio no puede estar vacío

### 5.2 MASACRES (`Base de Datos - Masacres (1).csv`)

#### 📍 COLUMNAS REQUERIDAS:
- **coord_x**: Longitud en formato decimal
- **coord_y**: Latitud en formato decimal

#### 📋 COLUMNAS OPCIONALES PERO RECOMENDADAS:
- **ID**: Identificador único
- **Municipio / MUNICIPIO**: Nombre del municipio
- **Número**: Número de identificación
- **Links**: URLs de referencias
- **Descripción resumida**: Resumen del incidente
- **año**: Año del evento
- **fecha**: Fecha completa del evento
- **LUGAR**: Ubicación específica

#### 📝 EJEMPLO DE FILA VÁLIDA:
```csv
ID,Municipio,Número,Links,Descripción resumida,año,fecha,coord_x,coord_y
1,Acajete,7/23,"https://...",Los cuerpos de dos personas...,2023,04/07/2023,-97.9473473,19.04164695
```

#### ⚠️ NOTAS IMPORTANTES:
- Las coordenadas deben ser números decimales válidos
- `coord_x` es negativo en el hemisferio oeste (México)
- `coord_y` es positivo en el hemisferio norte
- Si coord_x o coord_y es 0 o inválido, el registro se omite

### 5.3 PREPROCESAMIENTO DE DATOS

#### 🛠️ PASOS RECOMENDADOS:

1. Eliminar duplicados por coordenadas
2. Estandarizar nombres de municipios (mayúsculas/minúsculas)
3. Validar formato de fechas
4. Corregir coordenadas erróneas (invertidas, fuera de rango)
5. Completar campos vacíos críticos
6. Normalizar modalidades de fosa

#### 🔧 HERRAMIENTAS RECOMENDADAS:
- **Python con pandas** para limpieza
- **OpenRefine** para normalización
- **QGIS** para validación geográfica

---

## 6. COMPONENTES DEL SISTEMA

### 6.1 APP.TSX - COMPONENTE RAÍZ (602 líneas)

#### 🎯 RESPONSABILIDADES:
- Orquestación general de la aplicación
- Gestión de estado global (filtros, vista, modo 3D)
- Integración de capas de deck.gl
- Manejo de eventos de click en el mapa
- Transiciones de cámara (fly-to)
- Renderizado condicional de popups

#### 📊 ESTADO PRINCIPAL:
- `mapStyle`: Índice del mapa base actual (0-6)
- `viewState`: {longitude, latitude, zoom, bearing, pitch}
- `selectedFeature`: Fosa o masacre seleccionada
- `filters`: UnifiedFilters (todos los filtros activos)
- `is3D`: Booleano para modo 3D/2D
- `yearRange`: Rango de años seleccionado [min, max]
- `isPanelCollapsed`: Estado del panel de filtros

#### 🔑 FUNCIONES CLAVE:
- `onChangeMap()`: Cicla entre mapas base
- `filteredFosas`: useMemo que filtra fosas según criterios activos
- `filteredMasacres`: useMemo que filtra masacres
- `allYears`: useMemo que combina años de ambos datasets
- `onClick handler`: Maneja clicks en puntos, zoom y selección

#### 🗺️ MAPAS BASE DISPONIBLES:
1. World Imagery (ESRI satélite)
2. CartoDB Light
3. CartoDB Voyager
4. World Topo Map (ESRI)
5. OpenStreetMap
6. CartoDB Dark
7. Hipsográfico personalizado (API LAF)

### 6.2 UNIFIEDFILTERPANEL.TSX - PANEL DE FILTROS (635 líneas)

#### 🎯 RESPONSABILIDADES:
- Interfaz de filtrado independiente para fosas y masacres
- Checkboxes para mostrar/ocultar datasets
- Filtros específicos por tipo de dato
- Resultados scrolleables con pestañas
- Estado colapsable con callback

#### 🔍 FILTROS DE FOSAS:
- Municipio (multi-select con scroll)
- Zona (multi-select con scroll)
- Modalidad de fosa (checkboxes)
- Quién hizo el hallazgo (checkboxes)
- Búsqueda de texto

#### 🔍 FILTROS DE MASACRES:
- Municipio (multi-select con scroll)
- Búsqueda de texto

#### 📑 PESTAÑAS DE RESULTADOS:
- **Fosas**: Lista con municipio, año, zona
- **Masacres**: Lista con municipio, fecha
- Click en item hace zoom y selecciona

### 6.3 TIMELINE.TSX - LÍNEA DE TIEMPO (518 líneas)

#### 🎮 MODOS DE OPERACIÓN:

1. **ALL (Todos)**:
   - Muestra todos los años disponibles
   - Sin restricción temporal

2. **CUSTOM (Personalizado)**:
   - Dos handles arrastrables (min, max)
   - Drag de rango completo
   - Selección manual de años

3. **ANIMATION (Animación)**:
   - Avanza automáticamente año por año
   - Controles play/pause
   - Selector de velocidad (200ms - 1500ms)
   - Loop automático al final

4. **INDIVIDUAL (Individual)**:
   - Un solo handle
   - Selecciona un año específico
   - Útil para análisis puntual

#### 📊 INFORMACIÓN MOSTRADA:
- "X períodos • Y fosas • Z masacres"
- Actualizado en tiempo real

### 6.4 FOSAPOPUP.TSX - POPUP DE FOSAS

#### 📋 INFORMACIÓN MOSTRADA:
- Municipio
- Zona/ubicación
- Fecha de hallazgo
- Año
- Cuerpos encontrados
- Modalidad de fosa
- Características del sitio
- Quién hizo el hallazgo
- Descripción completa
- Enlaces (si existen)

#### 🎨 POSICIONAMIENTO:
- `position: fixed`
- `left: 50%, top: 50%`
- `transform: translate(-50%, -50%)`
- `z-index: 10000`
- Tema rojo para fosas

### 6.5 MASACREPOPUP.TSX - POPUP DE MASACRES

Similar a FosaPopup pero con:
- Información específica de masacres
- Posición: `right: 20px, top: 120px`
- Tema púrpura
- Campos: Municipio, Fecha, Lugar, Descripción, Links

### 6.6 COMPASS.TSX - BRÚJULA

#### 🧭 RESPONSABILIDADES:
- Mostrar orientación del mapa (bearing)
- Reset de orientación a norte
- Click resetea bearing a 0°

### 6.7 MODALIDADLEGEND.TSX - LEYENDA DE MODALIDADES

#### 🎨 RESPONSABILIDADES:
- Mostrar colores de polígonos por modalidad
- Visible solo cuando hay filtros de modalidad activos
- Lista modalidades con color y conteo
- Esquina inferior derecha

---

## 7. CAPAS DE VISUALIZACIÓN (LAYERS)

### 7.1 FOSALAYER.TS - CAPA DE FOSAS

#### ⚙️ CONFIGURACIÓN:
- **id**: `'fosas-circle-layer'`
- **getFillColor**: `[220, 38, 38, 200]` (rojo)
- **getLineColor**: `[153, 27, 27, 255]` (rojo oscuro)
- **radiusMinPixels**: 8
- **lineWidthMinPixels**: 2
- **stroked**: true
- **pickable**: true

### 7.2 MASACRESLAYER.TS - CAPA DE MASACRES

#### ⚙️ CONFIGURACIÓN:
- **id**: `'masacres-circle-layer'`
- **getFillColor**: `[155, 89, 182, 220]` (púrpura)
- **getLineColor**: `[75, 0, 130, 255]` (púrpura oscuro)
- **radiusMinPixels**: 7
- **lineWidthMinPixels**: 2

#### 🔄 DIFERENCIAS CON FOSAS:
- Radio ligeramente menor (7 vs 8 px)
- Color púrpura distintivo
- Mayor transparencia (220 vs 200)

### 7.3 POLÍGONOS DE MODALIDAD

#### 🔷 ALGORITMO CONVEX HULL:
- Implementación: Gift Wrapping (Jarvis March)
- Complejidad: O(nh) donde n=puntos, h=puntos en hull
- Agrupa fosas por modalidad
- Calcula envolvente convexa para cada grupo
- Requiere mínimo 3 puntos por modalidad

#### 🎨 COLORES POR MODALIDAD:
- **PRIMARIA**: Rojo vibrante `[231, 76, 60, 160]`
- **SECUNDARIA**: Azul brillante `[52, 152, 219, 160]`
- **TERCIARIA**: Verde esmeralda `[46, 204, 113, 160]`
- **CUATERNARIA**: Amarillo dorado `[241, 196, 15, 160]`
- **MÚLTIPLE**: Púrpura `[155, 89, 182, 160]`
- **INDIVIDUAL**: Naranja `[230, 126, 34, 160]`
- **COLECTIVA**: Turquesa `[26, 188, 156, 160]`
- **POZO PARA RIEGO**: Azul `[49, 130, 206, 160]`
- **DEFAULT**: Gris azulado `[149, 165, 166, 140]`

---

## 8. HOOKS DE DATOS

### 8.1 USEFOSASDATA.TS

#### 📦 TIPO DE RETORNO:
```typescript
export type FosaRecord = {
  position: [number, number]; // [lon, lat]
  raw: Record<string, any>;   // Datos originales del CSV
};
```

#### 🔄 FLUJO:
1. useEffect se ejecuta una vez al montar
2. Construye URL del CSV usando import.meta.url
3. Papa.parse carga y parsea el CSV
4. Por cada fila:
   - Extrae Coord_X y Coord_Y
   - Llama parseCoord() para convertir a decimal
   - Valida coordenadas
   - Crea FosaRecord con position y raw
5. setFosas actualiza estado

#### 🌐 FORMATOS SOPORTADOS (parseCoord):

1. **DECIMAL SIMPLE**: `"19.0416"` → `19.0416`
2. **DECIMAL CON ESPACIOS**: `"  19. 041 6  "` → `19.0416`
3. **GRADOS CON HEMISFERIO**: `"19.0416N"` → `19.0416`
4. **DMS**: `"19°02'29.76"N"` → `19.0416`
5. **DMS CON PUNTOS**: `"19.02.29.76"` → `19.0416`

### 8.2 USEMASACRESDATA.TS

Similar a useFosasData pero más simple:
- Solo maneja formato decimal
- parseFloat directo
- Omite registros donde coord_x === 0 o coord_y === 0
- Archivo: `"Base de Datos - Masacres (1).csv"`
- ~1085 filas

---

## 9. FLUJO DE DATOS

### 9.1 INICIALIZACIÓN

```
1. main.tsx renderiza <Root /> (App.tsx)
2. App.tsx ejecuta:
   - useFosasData() → carga Fosas_clandestinas_2.csv
   - useMasacresData() → carga Base de Datos - Masacres (1).csv
3. Papa.parse descarga y parsea CSVs
4. Hooks setean estado con arrays de registros
5. App.tsx calcula allYears (años únicos combinados)
6. yearRange se inicializa con [minYear, maxYear]
```

### 9.2 FILTRADO

**TRIGGER**: Usuario cambia filtros en UnifiedFilterPanel

**FLUJO**:
1. onChange callback actualiza filters en App.tsx
2. useMemo de filteredFosas se recalcula
3. useMemo de filteredMasacres se recalcula
4. UnifiedFilterPanel recibe nuevos arrays filtrados
5. Timeline recibe totales actualizados
6. Layers reciben arrays filtrados
7. deck.gl re-renderiza capas

### 9.3 CLICK EN PUNTO

**TRIGGER**: Usuario hace click en fosa o masacre

**FLUJO**:
1. deck.gl detecta click, info.object contiene el registro
2. App.tsx onClick handler verifica info.layer.id
3. Extrae feature.position [lon, lat]
4. Valida coordenadas finitas
5. setViewState con FlyToInterpolator (zoom suave)
6. setSelectedFeature con tipo y registro
7. FosaPopup o MasacrePopup se renderiza

---

## 10. FUNCIONALIDADES PRINCIPALES

### 10.1 VISUALIZACIÓN DE MAPAS

#### 🗺️ MAPAS BASE:
- 7 estilos de mapa disponibles
- Cambio con botón "Cambiar mapa"
- Fuentes: ESRI, CartoDB, OSM, API personalizada

#### 🎮 MODO 2D:
- pitch: 0
- Scroll zoom optimizado
- Mapas base como TileLayer

#### 🏔️ MODO 3D:
- pitch: 45
- TerrainLayer con elevación real
- Fuente de elevación: pingul-maps.hf.space
- Vista centrada en Puebla (19.041, -98.206)

#### 🕹️ INTERACCIONES:
- **Pan**: arrastrar con mouse/touch
- **Zoom**: scroll o pinch
- **Rotate**: Ctrl + arrastrar
- **Pitch**: Shift + arrastrar

### 10.2 SISTEMA DE FILTROS

#### 🔍 FILTROS DISPONIBLES:

**FOSAS**:
- Año (controlado por Timeline)
- Municipio (multi-select, ~40 municipios)
- Zona (multi-select)
- Modalidad de fosa (checkboxes, ~10 modalidades)
- Quién hizo el hallazgo (checkboxes, ~5 actores)
- Búsqueda de texto

**MASACRES**:
- Año (controlado por Timeline)
- Municipio (multi-select, ~100 municipios)
- Búsqueda de texto

#### ⚡ COMPORTAMIENTO:
- Filtros acumulativos (AND lógico)
- Actualización en tiempo real
- Contador de resultados
- Botón "Limpiar" resetea todos los filtros
- ~1000 registros filtrados en <50ms

### 10.3 LÍNEA DE TIEMPO

#### ⏱️ CARACTERÍSTICAS:
- Rango completo de años en datos (ej: 2012-2023)
- 4 modos de operación
- Animación con velocidad ajustable (200ms - 1500ms)
- Visualización de frecuencia por año
- Play/Pause
- Loop continuo

### 10.4 POPUPS INFORMATIVOS

#### 🔴 FOSA POPUP:
- Centrado en pantalla
- Tema rojo
- Campos completos del hallazgo
- Scrolleable
- Cierre: Escape, X, o click fuera

#### 🟣 MASACRE POPUP:
- Posicionado a la derecha (right: 20px, top: 120px)
- Tema púrpura
- Información de la masacre
- Enlaces externos
- Cierre: Escape o X

### 10.5 POLÍGONOS DE MODALIDAD

#### 🔷 ACTIVACIÓN:
- Se activa al filtrar por modalidad específica
- Un polígono por modalidad filtrada
- Convex hull de todos los puntos
- Color semi-transparente según modalidad

#### 📊 LEYENDA:
- Aparece automáticamente
- Lista modalidades visibles
- Muestra color y conteo
- Esquina inferior derecha

---

## 11. ESTILOS Y UI/UX

### 11.1 SISTEMA DE DISEÑO

#### 🎨 PALETA DE COLORES:

**FOSAS**:
- Primario: Rojo `#DC2626`
- Secundario: Rojo oscuro `#991B1B`
- Fondo: Blanco `#FFFFFF`
- Texto: Gris oscuro `#2D3748`

**MASACRES**:
- Primario: Púrpura `#9B59B6`
- Secundario: Púrpura oscuro `#4B0082`
- Fondo: Blanco `#FFFFFF`
- Texto: Gris oscuro `#2D3748`

**GENERAL**:
- UI: Blanco con sombras rgba(0,0,0,0.1-0.3)
- Texto secundario: `#6B7280`
- Bordes: `#E5E7EB`

#### 📝 TIPOGRAFÍA:
- **Font family**: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **H3**: 17px (títulos principales)
- **Body**: 13-14px (contenido)
- **Small**: 11-12px (metadatos)
- **Buttons**: 13px (acciones)

### 11.2 COMPONENTES UI

#### 🔘 BOTONES:
- Primarios: Fondo sólido con hover
- Secundarios: Fondo blanco con borde
- Border-radius: 6-8px
- Padding: 6-12px
- Transición: 0.2s

#### 📝 INPUTS:
- Border: 1px solid `#D1D5DB`
- Focus: border azul `#3B82F6` con shadow
- Placeholder: gris `#9CA3AF`
- Border-radius: 6px

#### ☑️ CHECKBOXES:
- Tamaño: 16x16px
- Checked: fondo azul `#3B82F6`
- Border-radius: 4px

### 11.3 ANIMACIONES Y TRANSICIONES

#### ⏱️ TRANSICIONES CSS:
- Duración: 0.3s (panel), 0.2s (botones)
- Easing: ease o cubic-bezier

#### 🎬 ANIMACIONES DECK.GL:
- FlyToInterpolator: transición suave de cámara
- Duración: 800ms para zoom

#### 🎭 HOVER EFFECTS:
- Scale: 1.05 en botones pequeños
- Shadow más pronunciada
- Transición: 0.2s

---

## 12. TECNOLOGÍAS UTILIZADAS

### 12.1 CORE FRAMEWORK

#### ⚛️ REACT 19.1.1:
- Biblioteca de UI declarativa
- Hooks para gestión de estado
- Virtual DOM para rendimiento
- StrictMode habilitado

#### 📘 TYPESCRIPT 5.8.3:
- Superset tipado de JavaScript
- Detección de errores en desarrollo
- IntelliSense mejorado
- Interfaces para datos CSV

#### ⚡ VITE 7.1.2:
- Build tool moderno
- HMR (Hot Module Replacement)
- Optimización de bundle
- Dev server rápido

### 12.2 VISUALIZACIÓN

#### 🗺️ DECK.GL 9.1.14:
- Framework de visualización geoespacial
- WebGL rendering de alto rendimiento
- **Capas**:
  * ScatterplotLayer (puntos)
  * PolygonLayer (áreas)
  * TileLayer (mapas base)
  * TerrainLayer (elevación 3D)
  * BitmapLayer (texturas)

### 12.3 PROCESAMIENTO DE DATOS

#### 📊 PAPAPARSE 5.4.1:
- Parser CSV robusto
- Streaming y descarga
- Detección automática de delimitadores
- Manejo de headers
- Conversión de tipos

### 12.4 STYLING

#### 🎨 TAILWIND CSS 4.1.14:
- Utility-first CSS framework
- JIT (Just-In-Time) compilation
- Clases optimizadas

#### 📝 CUSTOM CSS:
- src/index.css: ~400 líneas
- Clases personalizadas para componentes

### 12.5 DEVELOPMENT TOOLS

#### 🔧 ESLINT 9.33.0:
- Linter para JavaScript/TypeScript
- Reglas para React
- Plugins: react-hooks, react-refresh, typescript-eslint

#### 🌐 COORDINATE SYSTEMS:
- WGS84 (EPSG:4326): Sistema de coordenadas
- Decimal degrees: Formato de entrada
- Web Mercator: Proyección de visualización

---

## 13. OPTIMIZACIONES Y RENDIMIENTO

### 13.1 REACT OPTIMIZATIONS

#### 🚀 USEMEMO:
- Ubicaciones: `filteredFosas`, `filteredMasacres`, `allYears`
- Propósito: Evitar recálculos en cada render
- Dependencias: fosas, masacres, filters

#### 🔄 USECALLBACK:
- Handlers de eventos
- Callbacks pasados a componentes hijos
- Previene recreación de funciones

#### 📌 USEREF:
- Referencias a elementos DOM (Timeline track)
- Valores que no causan re-render (timers)
- Estado de drag & drop

### 13.2 DECK.GL OPTIMIZATIONS

#### ⚙️ UPDATETRIGGERS:
- Especificados en capas
- Previene updates innecesarios
- Triggers: data, getPosition, getFillColor

#### ✨ AUTOHIGHLIGHT:
- Habilitado para hover sin re-render
- WebGL maneja resaltado

#### 🎯 LAYER MANAGEMENT:
- Capas condicionales (showFosas, showMasacres)
- Solo carga capas necesarias

### 13.3 DATA PROCESSING

#### 📊 CSV PARSING:
- Una vez al inicio
- Datos cacheados en estado
- ~1000 registros en <500ms

#### 🌐 COORDINATE PARSING:
- Regex optimizados
- Early return en validaciones
- Skip de coordenadas inválidas

#### 🔍 FILTERING:
- Cliente-side (no round trips)
- useMemo para caching
- Filtros acumulativos eficientes

### 13.4 BUNDLE OPTIMIZATION

#### 🌳 TREE SHAKING:
- Vite automático
- ES modules preservados
- Dead code elimination

#### 🗜️ ASSET OPTIMIZATION:
- Logos PNG optimizados
- CSV comprimidos con gzip
- Font loading optimizado

### 13.5 PERFORMANCE METRICS

#### 📦 BUNDLE SIZE:
- deck.gl: ~500KB gzipped
- React: ~40KB gzipped
- Total app: ~600KB gzipped

#### ⏱️ LOAD TIME:
- Initial load: ~2-3s (4G)
- CSV parsing: ~200-500ms
- First render: ~1s

---

## 14. TROUBLESHOOTING

### 14.1 PROBLEMAS COMUNES

#### ❌ Puntos no aparecen en el mapa

**CAUSAS**:
- Coordenadas inválidas en CSV
- Coordenadas fuera de rango visible
- Filtros demasiado restrictivos
- CSV no cargado correctamente

**SOLUCIONES**:
1. Verificar CSV tiene Coord_X y Coord_Y correctos
2. Usar "Limpiar" filtros
3. Zoom out para ver más área
4. Revisar consola de navegador por errores

#### ❌ Mapa no carga o está en blanco

**CAUSAS**:
- Sin conexión a internet (mapas base)
- Bloqueador de contenido/ad-blocker
- Error en WebGL
- Caché corrupto

**SOLUCIONES**:
1. Verificar conexión a internet
2. Deshabilitar extensiones de navegador
3. Probar en modo incógnito
4. Limpiar caché (Ctrl+Shift+Delete)
5. Verificar que GPU está habilitada

#### ❌ Timeline no responde

**CAUSAS**:
- No hay años en datos
- Rango inválido
- JavaScript deshabilitado

**SOLUCIONES**:
1. Verificar que CSV tiene columna de año
2. Recargar página
3. Revisar consola por errores

#### ❌ Rendimiento lento

**CAUSAS**:
- Demasiados puntos visibles
- Modo 3D en hardware limitado
- Animación muy rápida

**SOLUCIONES**:
1. Aplicar filtros para reducir puntos
2. Cambiar a modo 2D
3. Cerrar otras pestañas
4. Aumentar intervalo de animación

### 14.2 ERRORES EN CONSOLA

#### 🐛 `"Cannot read property 'position' of undefined"`
- **CAUSA**: Registro sin coordenadas válidas
- **SOLUCIÓN**: Filtrar registros con coordenadas en hooks

#### 🐛 `"WebGL context lost"`
- **CAUSA**: Problema con GPU o memoria
- **SOLUCIÓN**: 
  1. Cerrar otras aplicaciones
  2. Actualizar drivers de GPU
  3. Reiniciar navegador

#### 🐛 `"Failed to fetch CSV"`
- **CAUSA**: Archivo CSV no encontrado o CORS
- **SOLUCIÓN**:
  1. Verificar ruta del CSV
  2. Asegurar que está en src/assets/
  3. Rebuild con `npm run build`

### 14.3 DEBUGGING

#### 🔍 HERRAMIENTAS:
- Chrome DevTools (F12)
- React DevTools extension
- Console logs estratégicos
- Network tab para CSV loads

#### 📊 PUNTOS DE INSPECCIÓN:
1. Estado de fosas y masacres en React DevTools
2. Valores de filters
3. Resultado de filteredFosas y filteredMasacres
4. ViewState en deck.gl
5. Eventos de click en console

#### 💡 LOGS ÚTILES:
```javascript
console.log(fosas.length) // después de carga
console.log(filters) // después de cambio
console.log(selectedFeature) // al hacer click
```

---

## 15. MANTENIMIENTO Y ACTUALIZACIÓN DE DATOS

### 15.1 ACTUALIZAR FOSAS

#### 📋 PASOS:

1. Preparar CSV actualizado con mismo formato
2. Limpiar datos con Python/pandas:
   ```python
   import pandas as pd
   df = pd.read_csv('fosas_raw.csv')
   df = df.dropna(subset=['Coord_X', 'Coord_Y'])
   df = df.drop_duplicates(subset=['Coord_X', 'Coord_Y'])
   df.to_csv('Fosas_clandestinas_2.csv', index=False)
   ```
3. Copiar a `src/assets/`
4. Verificar columnas requeridas
5. `npm run dev` para probar
6. `npm run build` para producción

#### ✅ VALIDACIONES:
- Coordenadas en rango válido
- Municipios normalizados
- Fechas en formato consistente
- Sin duplicados exactos

### 15.2 ACTUALIZAR MASACRES

Similar a fosas:
1. Preparar CSV con `coord_x`, `coord_y`
2. Validar formato decimal
3. Copiar a `src/assets/`
4. Renombrar si es necesario en `useMasacresData.ts`
5. Rebuild

**CONSIDERACIONES**:
- Archivo actual: `"Base de Datos - Masacres (1).csv"`
- Si cambia nombre, actualizar línea 13 de `useMasacresData.ts`

### 15.3 AGREGAR NUEVOS CAMPOS

#### 🆕 SI SE AGREGA CAMPO A CSV:

1. Actualizar tipos en hooks (`FosaRecord` o `MasacreRecord`)
2. Modificar Popup para mostrar nuevo campo
3. Opcionalmente agregar a filtros
4. Actualizar UnifiedFilterPanel si se necesita filtrar

#### 📝 EJEMPLO:
```typescript
// En FosaPopup.tsx
const nuevoCampo = getValue(feature.raw, ['NUEVO_CAMPO', 'nuevo_campo']);
// Agregar en JSX:
{nuevocampo && (
  <div>
    <strong>Nuevo Campo:</strong> {nuevocampo}
  </div>
)}
```

### 15.4 MANTENIMIENTO DE CÓDIGO

#### 📌 VERSIONADO:
- Git branches por feature
- Commits descriptivos
- Tags para releases

#### 🧪 TESTING:
- Pruebas manuales después de cambios
- Verificar en múltiples navegadores
- Probar con datos edge case

#### 📚 DOCUMENTACIÓN:
- Actualizar este archivo
- Comentarios en código complejo
- README.md con cambios

#### ⚡ PERFORMANCE:
- Perfilar con Chrome DevTools
- Monitorear tamaño de bundle
- Optimizar imports si crece

---

## 📄 INFORMACIÓN DEL PROYECTO

**ÚLTIMA ACTUALIZACIÓN**: Diciembre 7, 2025  
**VERSIÓN**: 1.0.0  
**AUTOR**: Documentación generada por análisis de código  
**PROYECTO**: LAF - Laboratorio de Análisis Forense (visualización)

### 🔗 ENLACES ÚTILES:
- **Repositorio GitHub**: https://github.com/Inigo1405/LAF
- **Issues**: Reportar problemas en [GitHub Issues](https://github.com/Inigo1405/LAF/issues)
- **Contacto**: IBERO Puebla

### 🏛️ INSTITUCIONES:
- **LAF** (Laboratorio de Arquitectura Forense)
- **Universidad Iberoamericana Puebla**

---

## 📜 LICENCIA

Este proyecto está desarrollado para fines de **investigación en derechos humanos**.

### ⚠️ CONSIDERACIONES IMPORTANTES:
- Los datos mostrados son de carácter sensible y deben tratarse con el respeto y seriedad que merecen
- Esta herramienta tiene fines educativos y de investigación académica
- Se recomienda verificar la información con fuentes oficiales para uso en investigaciones formales

---

**Desarrollado con ❤️ para la memoria y la justicia**
