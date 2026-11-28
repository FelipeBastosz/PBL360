import { type KeyboardEvent, useRef } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import type { SystemColorPreset } from '@/types/preferences';
import { cn } from '@/utils/cn';
import { getNextGridIndex } from '@/utils/gridNavigation';
import { getColorDisplayName, SYSTEM_COLOR_PALETTE } from '@/utils/themePalette';

const SWATCH_COLUMNS = 5;

function ColorSwatchButton({
  preset,
  isSelected,
  buttonRef,
  onSelect,
  onKeyDown,
}: {
  preset: SystemColorPreset;
  isSelected: boolean;
  buttonRef: (el: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const ariaLabel = preset.isDefault ? `${preset.name} (padrão)` : preset.name;
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={ariaLabel}
      title={preset.name}
      style={{ backgroundColor: preset.hex }}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        'flex h-7 w-full items-center justify-center rounded-lg border border-black/15 transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent dark:border-white/25',
        isSelected && 'ring-2 ring-brand-accent ring-offset-2 ring-offset-elevated',
      )}
    >
      {isSelected && (
        <CheckIcon
          className="size-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
          strokeWidth={2.75}
          aria-hidden
        />
      )}
    </button>
  );
}

export function ColorSwatchGrid({
  selectedHex,
  onSelect,
}: {
  selectedHex: string;
  onSelect: (hex: string) => void;
}) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const activeName = getColorDisplayName(selectedHex);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndex = getNextGridIndex(
      event.key,
      index,
      SYSTEM_COLOR_PALETTE.length,
      SWATCH_COLUMNS,
    );
    if (nextIndex === null) return;
    event.preventDefault();
    buttonsRef.current[nextIndex]?.focus();
  }

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-2">
        <p id="appearance-suggested-colors-label" className="text-xs font-semibold text-muted">
          Cores sugeridas
        </p>
        <span className="truncate text-xs font-semibold text-brand-accent">{activeName}</span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="appearance-suggested-colors-label"
        className="mt-2 grid grid-cols-5 gap-2"
      >
        {SYSTEM_COLOR_PALETTE.map((preset, index) => (
          <ColorSwatchButton
            key={preset.id}
            preset={preset}
            isSelected={selectedHex === preset.hex}
            buttonRef={(el) => {
              buttonsRef.current[index] = el;
            }}
            onSelect={() => onSelect(preset.hex)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          />
        ))}
      </div>
    </div>
  );
}
