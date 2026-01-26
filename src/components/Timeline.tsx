import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  years: number[];
  range: [number, number];
  onChange: (min: number, max: number) => void;
  totalFosas?: number;
  totalMasacres?: number;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const Timeline: React.FC<Props> = ({ years, range, onChange, totalFosas = 0, totalMasacres = 0 }) => {
  const sortedYears = useMemo(() => Array.from(new Set(years || [])).sort((a, b) => a - b), [years]);
  if (!sortedYears.length) return null;

  const domainMin = sortedYears[0];
  const domainMax = sortedYears[sortedYears.length - 1];
  const safeMin = clamp(Math.min(range[0], range[1]), domainMin, domainMax);
  const safeMax = clamp(Math.max(range[0], range[1]), domainMin, domainMax);

  const [mode, setMode] = useState<'all' | 'custom' | 'animation' | 'individual'>('all');
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState<number>(700);
  const timerRef = useRef<number | null>(null);

  // Drag state
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<null | 'min' | 'max' | 'range'>(null);
  const pointerActiveRef = useRef<boolean>(false);
  const startMinIndexRef = useRef<number>(0);
  const startMaxIndexRef = useRef<number>(0);
  const anchorIndexRef = useRef<number>(0);
  // Removed hover tooltip state for handles

  // Helpers
  const snapToYear = (value: number): number => {
    return sortedYears.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev));
  };

  const percentFromYear = (year: number) => {
    if (domainMax === domainMin) return 0;
    return ((year - domainMin) / (domainMax - domainMin)) * 100;
  };

  const yearFromClientX = (clientX: number, track: HTMLDivElement): number => {
    const rect = track.getBoundingClientRect();
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
    const raw = domainMin + pct * (domainMax - domainMin);
    return snapToYear(Math.round(raw));
  };

  const closestIndex = (value: number): number => {
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < sortedYears.length; i++) {
      const d = Math.abs(sortedYears[i] - value);
      if (d < bestDist) { best = i; bestDist = d; }
    }
    return best;
  };

  // Animation effect
  useEffect(() => {
    if (!playing || mode !== 'animation') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      const currentIdx = sortedYears.findIndex((y) => y === safeMax);
      const nextIdx = currentIdx + 1;
      if (nextIdx >= sortedYears.length) {
        setPlaying(false);
        return;
      }
      onChange(safeMin, sortedYears[nextIdx]);
    }, speedMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing, mode, sortedYears, safeMin, safeMax, speedMs, onChange]);

  // Mode handlers
  const handleModeAll = () => {
    setMode('all');
    setPlaying(false);
    onChange(domainMin, domainMax);
  };
  
  const handleModeAnimation = () => {
    setMode('animation');
    setPlaying(false);
    onChange(domainMin, domainMin);
  };

  const handlePlayPause = () => {
    if (mode !== 'animation') return;
    if (!playing) {
      onChange(domainMin, domainMin);
    }
    setPlaying((p) => !p);
  };
  const handleReset = () => {
    setPlaying(false);
    if (mode === 'animation') onChange(domainMin, domainMin);
    else if (mode === 'individual') onChange(domainMin, domainMin);
    else onChange(domainMin, domainMax);
  };

  // Individual year navigation
  const handleStepYear = (direction: -1 | 1) => {
    const currentIdx = closestIndex(safeMin);
    const newIdx = direction === -1 
      ? Math.max(0, currentIdx - 1)
      : Math.min(sortedYears.length - 1, currentIdx + 1);
    onChange(sortedYears[newIdx], sortedYears[newIdx]);
  };

  // Drag handlers
  const removeWindowListeners = () => {
    window.removeEventListener('pointermove', onWindowDragMove as any, true as any);
    window.removeEventListener('pointerup', onWindowDragEnd as any, true as any);
    window.removeEventListener('pointercancel', onWindowDragEnd as any, true as any);
    window.removeEventListener('mousemove', onWindowDragMove as any, true as any);
    window.removeEventListener('mouseup', onWindowDragEnd as any, true as any);
    window.removeEventListener('touchmove', onWindowDragMove as any, true as any);
    window.removeEventListener('touchend', onWindowDragEnd as any, true as any);
    window.removeEventListener('touchcancel', onWindowDragEnd as any, true as any);
  };

  const getClientX = (e: any): number | null => {
    if (typeof e.clientX === 'number') return e.clientX as number;
    if (e.touches && e.touches[0]) return e.touches[0].clientX as number;
    if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX as number;
    return null;
  };

  const onWindowDragMove = (e: Event) => {
    if (!trackRef.current || !draggingRef.current || !pointerActiveRef.current) return;
    const cx = getClientX(e);
    if (cx == null) return;
    const y = yearFromClientX(cx, trackRef.current);
    if (mode === 'individual') {
      onChange(y, y);
      return;
    }
    if (draggingRef.current === 'min') {
      const newMin = Math.min(y, safeMax);
      onChange(newMin, Math.max(newMin, safeMax));
    } else if (draggingRef.current === 'max') {
      const newMax = Math.max(y, safeMin);
      onChange(Math.min(safeMin, newMax), newMax);
    } else if (draggingRef.current === 'range') {
      const currentIndex = closestIndex(y);
      const delta = currentIndex - anchorIndexRef.current;
      const width = startMaxIndexRef.current - startMinIndexRef.current;
      let newMinIdx = startMinIndexRef.current + delta;
      newMinIdx = Math.max(0, Math.min(newMinIdx, sortedYears.length - 1 - width));
      const newMaxIdx = newMinIdx + width;
      onChange(sortedYears[newMinIdx], sortedYears[newMaxIdx]);
    }
  };

  const onWindowDragEnd = () => {
    draggingRef.current = null;
    pointerActiveRef.current = false;
    removeWindowListeners();
  };

  useEffect(() => {
    return () => removeWindowListeners();
  }, []);

  const onPointerDownTrack = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const clickedYear = yearFromClientX(e.clientX, trackRef.current);
    
    if (mode === 'individual') {
      // In individual mode, clicking sets both min and max to the same year
      onChange(clickedYear, clickedYear);
      return;
    }
    
    const distToMin = Math.abs(clickedYear - safeMin);
    const distToMax = Math.abs(clickedYear - safeMax);
    if (distToMin <= distToMax) {
      const newMin = Math.min(clickedYear, safeMax);
      draggingRef.current = 'min';
      onChange(newMin, Math.max(newMin, safeMax));
    } else {
      const newMax = Math.max(clickedYear, safeMin);
      draggingRef.current = 'max';
      onChange(Math.min(safeMin, newMax), newMax);
    }
    pointerActiveRef.current = true;
    window.addEventListener('pointermove', onWindowDragMove as any, { capture: true, passive: false } as any);
    window.addEventListener('pointerup', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('pointercancel', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('mousemove', onWindowDragMove as any, { capture: true, passive: false } as any);
    window.addEventListener('mouseup', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('touchmove', onWindowDragMove as any, { capture: true, passive: false } as any);
    window.addEventListener('touchend', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('touchcancel', onWindowDragEnd as any, { capture: true, passive: false } as any);
  };

  const startDrag = (which: 'min' | 'max') => (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    draggingRef.current = which;
    pointerActiveRef.current = true;
    window.addEventListener('pointermove', onWindowDragMove as any, { capture: true, passive: false } as any);
    window.addEventListener('pointerup', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('pointercancel', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('mousemove', onWindowDragMove as any, { capture: true, passive: false } as any);
    window.addEventListener('mouseup', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('touchmove', onWindowDragMove as any, { capture: true, passive: false } as any);
    window.addEventListener('touchend', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('touchcancel', onWindowDragEnd as any, { capture: true, passive: false } as any);
  };

  const startRangeDrag = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    draggingRef.current = 'range';
    pointerActiveRef.current = true;
    startMinIndexRef.current = closestIndex(safeMin);
    startMaxIndexRef.current = closestIndex(safeMax);
    anchorIndexRef.current = closestIndex(yearFromClientX(e.clientX, trackRef.current));
    window.addEventListener('pointermove', onWindowDragMove as any, { capture: true, passive: false } as any);
    window.addEventListener('pointerup', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('pointercancel', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('mousemove', onWindowDragMove as any, { capture: true, passive: false } as any);
    window.addEventListener('mouseup', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('touchmove', onWindowDragMove as any, { capture: true, passive: false } as any);
    window.addEventListener('touchend', onWindowDragEnd as any, { capture: true, passive: false } as any);
    window.addEventListener('touchcancel', onWindowDragEnd as any, { capture: true, passive: false } as any);
  };

  // Keyboard support
  const onHandleKeyDown = (which: 'min' | 'max') => (e: React.KeyboardEvent) => {
    const isLeft = e.key === 'ArrowLeft';
    const isRight = e.key === 'ArrowRight';
    if (!isLeft && !isRight) return;
    e.preventDefault();
    const step = e.shiftKey ? 5 : 1;
    const minIdx = closestIndex(safeMin);
    const maxIdx = closestIndex(safeMax);
    if (mode === 'individual') {
      let next = minIdx + (isRight ? step : -step);
      next = Math.max(0, Math.min(next, sortedYears.length - 1));
      onChange(sortedYears[next], sortedYears[next]);
      return;
    }
    if (which === 'min') {
      let next = minIdx + (isRight ? step : -step);
      next = Math.max(0, Math.min(next, maxIdx));
      onChange(sortedYears[next], safeMax);
    } else {
      let next = maxIdx + (isRight ? step : -step);
      next = Math.max(minIdx, Math.min(next, sortedYears.length - 1));
      onChange(safeMin, sortedYears[next]);
    }
  };

  // Stats
  const yearsInRange = sortedYears.filter((y) => y >= safeMin && y <= safeMax);

  // Visible tick marks and labels
  // We show a small tick for every available year and show labels for a subset to avoid clutter
  const targetLabelCount = 8; // aim for ~8 labels max (responsive enough)
  const labelEvery = Math.max(1, Math.ceil(sortedYears.length / targetLabelCount));
  const labelYearsSet = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < sortedYears.length; i += labelEvery) set.add(sortedYears[i]);
    // Ensure first and last are included
    set.add(sortedYears[0]);
    set.add(sortedYears[sortedYears.length - 1]);
    return set;
  }, [sortedYears, labelEvery]);

  // UI Components
  const ModeButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button 
      className='text-xs font-semibold rounded-md py-1 px-2 border cursor-pointer'
      onClick={onClick} 
      style={{
        borderColor: active ? '#3182ce' : '#e2e8f0',
        background: active ? '#3182ce' : 'white',
        color: active ? 'white' : '#2d3748',
      }}
    >
      {children}
    </button>
  );

  const ControlButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button 
      className='text-xs font-semibold rounded-md py-1 px-2  cursor-pointer border border-[#e2e8f0]'
      onClick={onClick} 
    >
      {children}
    </button>
  );

  // Inline icons for animation controls (use currentColor to inherit button color)
  const IconPlay = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
  const IconPause = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>
  );
  const IconReset = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
    </svg>
  );

  return (
    <div className=" w-full px-4 bottom-4 h-28 fixed text-[#4a5568]"
      onWheelCapture={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className='bg-white flex flex-col gap-5 py-3 px-4 rounded-lg h-full'
        style={{
          alignItems: 'stretch',
        }}
      >
        {/* Top Row: Title/Range (left) + Controls (right) */}
        <div className='flex justify-between'>
          {/* Left Section - Title and Range Display */}
          <div className='text-[#2d3748] flex gap-3 font-semibold items-center'>
            <h3>Línea del tiempo</h3>
            <div className='font-mono text-xs rounded-2xl py-1 px-2 border border-[#e2e8f0]'>
              {safeMin === safeMax ? safeMin : `${safeMin} – ${safeMax}`}
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className='flex items-center gap-1'>
            <ModeButton active={mode === 'all'} onClick={handleModeAll}>Todas</ModeButton>
            
            <ModeButton 
              active={mode === 'individual'} 
              onClick={() => {
                setMode('individual');
                setPlaying(false);
                // Set to first year only
                onChange(sortedYears[0], sortedYears[0]);
              }}
            >
              Individual
            </ModeButton>

            {mode === 'individual' && (
              <>
                <ControlButton onClick={() => handleStepYear(-1)} aria-label="Año anterior">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </ControlButton>
                <ControlButton onClick={() => handleStepYear(1)} aria-label="Año siguiente">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </ControlButton>
              </>
            )}

            <ModeButton active={mode === 'animation'} onClick={handleModeAnimation}>Anim</ModeButton>
            
            {/* Animation Controls */}
            {mode === 'animation' && (
              <div className='flex items-center gap-1 mx-4'>
                  <ControlButton onClick={handlePlayPause} aria-label={playing ? 'Pausar animación' : 'Reproducir animación'}>
                    {playing ? <IconPause /> : <IconPlay />}
                  </ControlButton>
                  <ControlButton onClick={handleReset} aria-label="Reiniciar animación">
                    <IconReset />
                  </ControlButton>
                  
                  <p className='text-xs'>Vel:</p>
                  <ModeButton active={speedMs===1200} onClick={() => setSpeedMs(1200)}>L</ModeButton>
                  <ModeButton active={speedMs===700} onClick={() => setSpeedMs(700)}>M</ModeButton>
                  <ModeButton active={speedMs===300} onClick={() => setSpeedMs(300)}>R</ModeButton>
              </div>
            )}

            {/* Stats */}
            <div className='bg-[#3182ce] rounded-lg text-xs font-semibold text-white py-1 px-2'>
              {yearsInRange.length} períodos • {totalFosas} fosas • {totalMasacres} masacres
            </div>
          </div>
        </div>

        {/* Bottom Row: Full-width Slider */}
        <div className='flex-1 relative mx-4 select-none touch-none text-[#2d3748]'>
          <div
            ref={trackRef}
            onPointerDown={onPointerDownTrack}
            className='w-full absolute cursor-grab h-2 mt-6 bg-[#e2e8f0]'
          >
            {/* Active range */}
            <div
              onPointerDown={startRangeDrag}
              className='absolute'
              style={{
                left: mode === 'individual' ? `calc(${percentFromYear(safeMin)}% - 1px)` : `calc(${percentFromYear(safeMin)}% )`,
                right: mode === 'individual' ? `calc(${100 - percentFromYear(safeMin)}% - 1px)` : `calc(${100 - percentFromYear(safeMax)}% )`,
                top: 1,
                bottom: 1,
                background: mode === 'animation' && playing 
                  ? 'linear-gradient(90deg, #f59e0b, #f97316)' 
                  : 'linear-gradient(90deg, #3182ce, #2c5aa0)',
              }}
            />

            {/* Always-visible ticks for each year */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
              {sortedYears.map((year) => {
                const inRange = year >= safeMin && year <= safeMax;
                const isLabel = labelYearsSet.has(year);
                return (
                  <div 
                    key={`tick-${year}`} 
                    className='absolute top-1/2'
                    style={{
                      left: `calc(${percentFromYear(year)}% )`,
                      transform: 'translate(-50%, -50%)',
                      width: isLabel ? 2 : 1,
                      height: isLabel ? 12 : 8,
                      background: inRange ? '#2b6cb0' : '#cbd5e0'
                    }} 
                  />
                );
              })}
            </div>

            {/* Min handle */}
            <div
              role="slider"
              aria-valuemin={domainMin}
              aria-valuemax={safeMax}
              aria-valuenow={safeMin}
              onPointerDown={startDrag('min')}
              onKeyDown={onHandleKeyDown('min')}
              tabIndex={0}
              className='w-5 h-5 z-2 absolute rounded-full cursor-grab bg-white top-1/2'
              style={{
                left: `calc(${percentFromYear(safeMin)}% - 10px)`,
                transform: 'translateY(-50%)',
                border: '3px solid #3182ce'
              }}
            />

            {/* Max handle (hidden in individual mode) */}
            {mode !== 'individual' && (
              <div
                role="slider"
                aria-valuemin={safeMin}
                aria-valuemax={domainMax}
                aria-valuenow={safeMax}
                onPointerDown={startDrag('max')}
                onKeyDown={onHandleKeyDown('max')}
                tabIndex={0}
                className='w-5 h-5 z-2 absolute rounded-full bg-white top-1/2 '
                style={{
                  left: `calc(${percentFromYear(safeMax)}% - 10px)`,
                  transform: 'translateY(-50%)',
                  border: '3px solid #3182ce'
                }}
              />
            )}
          </div>

          {/* Labels rail above the track (one label per year) */}
          <div className='w-full'>
            {sortedYears.map((year) => (
              <div 
                key={`label-${year}`} 
                className='text-xs font-semibold absolute'
                style={{
                  left: `calc(${percentFromYear(year)}% )`,
                  transform: 'translateX(-50%)',
                }}
              >
                {year}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Timeline;