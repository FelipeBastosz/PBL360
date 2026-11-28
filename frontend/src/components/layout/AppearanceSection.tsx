import { type ComponentType, type KeyboardEvent, type SVGProps, useCallback, useRef } from 'react';
import { ArrowPathIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import type { ThemePreference } from '@/types/preferences';
import { cn } from '@/utils/cn';
import { getNextGridIndex } from '@/utils/gridNavigation';
import { applyPreferencesToDom } from '@/utils/themeDom';
import { DEFAULT_SYSTEM_COLOR } from '@/utils/themePalette';
import { ColorPicker } from './ColorPicker';
import { ColorSwatchGrid } from './ColorSwatchGrid';

type ThemeOption = {
  value: ThemePreference;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'CLARO', label: 'Claro', Icon: SunIcon },
  { value: 'ESCURO', label: 'Escuro', Icon: MoonIcon },
];

function ThemeOptionButton({
  option,
  isSelected,
  buttonRef,
  onSelect,
  onKeyDown,
}: {
  option: ThemeOption;
  isSelected: boolean;
  buttonRef: (el: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const { label, Icon } = option;
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent',
        isSelected
          ? 'bg-elevated text-brand-accent shadow-xs ring-1 ring-brand-border'
          : 'text-muted hover:text-ink',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

function ThemeSelector({
  theme,
  onSelect,
}: {
  theme: ThemePreference;
  onSelect: (next: ThemePreference) => void;
}) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndex = getNextGridIndex(event.key, index, THEME_OPTIONS.length, 1);
    if (nextIndex === null) return;
    event.preventDefault();
    buttonsRef.current[nextIndex]?.focus();
  }

  return (
    <div>
      <p id="appearance-theme-label" className="text-xs font-semibold text-muted">
        Tema
      </p>
      <div
        role="radiogroup"
        aria-labelledby="appearance-theme-label"
        className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl border border-border-subtle bg-subtle p-1"
      >
        {THEME_OPTIONS.map((option, index) => (
          <ThemeOptionButton
            key={option.value}
            option={option}
            isSelected={theme === option.value}
            buttonRef={(el) => {
              buttonsRef.current[index] = el;
            }}
            onSelect={() => onSelect(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          />
        ))}
      </div>
    </div>
  );
}

function AppearanceHeader({ isSaving }: { isSaving: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <p
        id="appearance-section-title"
        className="text-xs font-bold tracking-widest text-brand-300 uppercase"
      >
        Aparência
      </p>
      <span
        aria-live="polite"
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted"
      >
        {isSaving ? (
          <>
            <Spinner className="size-3 text-brand-accent" />
            Salvando...
          </>
        ) : null}
      </span>
    </div>
  );
}

function ResetColorButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent',
        disabled
          ? 'cursor-not-allowed text-placeholder opacity-60'
          : 'text-brand-accent hover:bg-brand-soft',
      )}
    >
      <ArrowPathIcon className="size-3.5 shrink-0" aria-hidden />
      <span>Restaurar cor padrão</span>
    </button>
  );
}

export function AppearanceSection({ showHeader = true }: { showHeader?: boolean }) {
  const { preferences, isSaving, errorMessage, setTheme, setColor, resetColor } =
    useUserPreferences();
  const isDefaultColor = preferences.cor === DEFAULT_SYSTEM_COLOR;

  const handlePreviewColor = useCallback(
    (hex: string) => {
      applyPreferencesToDom({ tema: preferences.tema, cor: hex });
    },
    [preferences.tema],
  );

  return (
    <section
      aria-labelledby={showHeader ? 'appearance-section-title' : undefined}
      aria-label={showHeader ? undefined : 'Aparência'}
      className={cn(showHeader && 'mt-4 border-t border-border-subtle px-3 pt-4 pb-3')}
    >
      {showHeader && <AppearanceHeader isSaving={isSaving} />}
      <ThemeSelector theme={preferences.tema} onSelect={(next) => void setTheme(next)} />
      <ColorPicker
        selectedHex={preferences.cor}
        onPreview={handlePreviewColor}
        onCommit={(hex) => void setColor(hex)}
      />
      <ColorSwatchGrid selectedHex={preferences.cor} onSelect={(hex) => void setColor(hex)} />
      <ResetColorButton disabled={isDefaultColor} onClick={() => void resetColor()} />
      {errorMessage && (
        <Alert tone="error" className="mt-3 py-2 text-xs">
          {errorMessage}
        </Alert>
      )}
    </section>
  );
}
