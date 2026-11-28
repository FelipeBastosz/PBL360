import { type KeyboardEvent, type PointerEvent, type RefObject, useRef } from 'react';
import { clamp, getContrastRatio, type HsvColor, hsvToHex } from '@/utils/colorMath';

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperConstructor {
  new (): { open: () => Promise<EyeDropperResult> };
}

type WindowWithEyeDropper = Window & { EyeDropper?: EyeDropperConstructor };

const HUE_GRADIENT =
  'linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)';

function getRelativePoint(element: HTMLElement | null, clientX: number, clientY: number) {
  if (!element) return { x: 0, y: 0 };
  const rect = element.getBoundingClientRect();
  return {
    x: rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0,
    y: rect.height > 0 ? clamp((clientY - rect.top) / rect.height, 0, 1) : 0,
  };
}

function getSpectrumKeyDelta(key: string): { ds: number; dv: number } | null {
  if (key === 'ArrowRight') return { ds: 0.05, dv: 0 };
  if (key === 'ArrowLeft') return { ds: -0.05, dv: 0 };
  if (key === 'ArrowUp') return { ds: 0, dv: 0.05 };
  if (key === 'ArrowDown') return { ds: 0, dv: -0.05 };
  return null;
}

function usePointerDrag<T>(
  ref: RefObject<HTMLDivElement | null>,
  mapPoint: (point: { x: number; y: number }) => T,
  onChange: (next: T) => void,
  onCommit: (next: T) => void,
) {
  const draggingRef = useRef(false);
  const read = (event: PointerEvent<HTMLDivElement>) =>
    mapPoint(getRelativePoint(ref.current, event.clientX, event.clientY));

  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      draggingRef.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      onChange(read(event));
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      if (draggingRef.current) onChange(read(event));
    },
    onPointerUp(event: PointerEvent<HTMLDivElement>) {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      onCommit(read(event));
    },
  };
}

function SpectrumOverlays({ hsv, currentHex }: { hsv: HsvColor; currentHex: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to right, #FFFFFF, transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to top, #000000, transparent)' }}
      />
      <span
        aria-hidden
        style={{
          left: `${hsv.s * 100}%`,
          top: `${(1 - hsv.v) * 100}%`,
          backgroundColor: currentHex,
        }}
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
      />
    </>
  );
}

export function ColorSpectrumArea({
  hsv,
  currentHex,
  onChange,
  onCommit,
}: {
  hsv: HsvColor;
  currentHex: string;
  onChange: (next: HsvColor) => void;
  onCommit: (next: HsvColor) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const dragHandlers = usePointerDrag(
    areaRef,
    ({ x, y }) => ({ h: hsv.h, s: x, v: 1 - y }),
    onChange,
    onCommit,
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const delta = getSpectrumKeyDelta(event.key);
    if (!delta) return;
    event.preventDefault();
    const next: HsvColor = {
      h: hsv.h,
      s: clamp(hsv.s + delta.ds, 0, 1),
      v: clamp(hsv.v + delta.dv, 0, 1),
    };
    onChange(next);
    onCommit(next);
  }

  return (
    <div
      ref={areaRef}
      role="slider"
      tabIndex={0}
      aria-label="Saturação e brilho"
      aria-valuetext={currentHex}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsv.s * 100)}
      onKeyDown={handleKeyDown}
      {...dragHandlers}
      style={{ backgroundColor: `hsl(${Math.round(hsv.h)}, 100%, 50%)` }}
      className="relative h-44 w-full cursor-crosshair touch-none overflow-hidden rounded-xl select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
    >
      <SpectrumOverlays hsv={hsv} currentHex={currentHex} />
    </div>
  );
}

export function HueSlider({
  hue,
  onChange,
  onCommit,
}: {
  hue: number;
  onChange: (nextHue: number) => void;
  onCommit: (nextHue: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragHandlers = usePointerDrag(
    trackRef,
    ({ x }) => Math.round(x * 360) % 360,
    onChange,
    onCommit,
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const isForward = event.key === 'ArrowRight' || event.key === 'ArrowUp';
    const isBackward = event.key === 'ArrowLeft' || event.key === 'ArrowDown';
    if (!isForward && !isBackward) return;
    event.preventDefault();
    const nextHue = (Math.round(hue) + (isForward ? 6 : -6) + 360) % 360;
    onChange(nextHue);
    onCommit(nextHue);
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Matiz"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hue)}
      onKeyDown={handleKeyDown}
      {...dragHandlers}
      style={{ background: HUE_GRADIENT }}
      className="relative h-3.5 w-full cursor-pointer touch-none rounded-full select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
    >
      <span
        aria-hidden
        style={{
          left: `${(clamp(hue, 0, 360) / 360) * 100}%`,
          backgroundColor: hsvToHex({ h: hue, s: 1, v: 1 }),
        }}
        className="pointer-events-none absolute top-1/2 size-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
}

function EyedropperIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
    </svg>
  );
}

export function EyedropperButton({
  hex,
  onPick,
}: {
  hex: string;
  onPick: (pickedHex: string) => void;
}) {
  const supportsEyeDropper =
    typeof window !== 'undefined' &&
    typeof (window as WindowWithEyeDropper).EyeDropper === 'function';
  const iconColor = getContrastRatio(hex, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#0F172A';

  async function handleClick() {
    const EyeDropperApi = (window as WindowWithEyeDropper).EyeDropper;
    if (!EyeDropperApi) return;
    try {
      const result = await new EyeDropperApi().open();
      if (result?.sRGBHex) onPick(result.sRGBHex);
    } catch {
      // User cancelled eyedropper selection.
    }
  }

  return (
    <button
      type="button"
      disabled={!supportsEyeDropper}
      onClick={() => void handleClick()}
      aria-label="Selecionar cor da tela"
      title={supportsEyeDropper ? 'Selecionar cor da tela' : `Cor atual: ${hex}`}
      style={{ backgroundColor: hex, color: iconColor }}
      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-black/10 shadow-xs transition-transform duration-150 enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent dark:border-white/15"
    >
      <EyedropperIcon className="size-4.5" />
    </button>
  );
}
