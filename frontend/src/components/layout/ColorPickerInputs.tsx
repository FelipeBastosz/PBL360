import { type ChangeEvent, type KeyboardEvent, useState } from 'react';
import { clamp, hexToRgb, isValidHexColor, rgbToHex, type RgbColor } from '@/utils/colorMath';

const RGB_CHANNELS: readonly { key: keyof RgbColor; label: string; ariaLabel: string }[] = [
  { key: 'r', label: 'R', ariaLabel: 'Vermelho (R)' },
  { key: 'g', label: 'G', ariaLabel: 'Verde (G)' },
  { key: 'b', label: 'B', ariaLabel: 'Azul (B)' },
];

function parseHexInput(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase();
  const prefixed = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
  return isValidHexColor(prefixed) ? prefixed : null;
}

function HexInputField({
  hex,
  onCommitHex,
}: {
  hex: string;
  onCommitHex: (nextHex: string) => void;
}) {
  const [draft, setDraft] = useState<{ source: string; text: string } | null>(null);
  const value = draft?.source === hex ? draft.text : hex;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    setDraft({ source: hex, text: raw });
    const parsed = parseHexInput(raw);
    if (parsed) onCommitHex(parsed);
  }

  function handleCommit() {
    const parsed = parseHexInput(value);
    setDraft(null);
    if (parsed && parsed !== hex) onCommitHex(parsed);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') handleCommit();
  }

  return (
    <div>
      <label
        htmlFor="color-picker-hex"
        className="block text-[11px] font-semibold tracking-wide text-muted uppercase"
      >
        HEX
      </label>
      <input
        id="color-picker-hex"
        type="text"
        inputMode="text"
        spellCheck={false}
        maxLength={7}
        value={value}
        onChange={handleChange}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        aria-label="Código hexadecimal da cor"
        className="mt-1 w-full rounded-lg border border-border bg-subtle/60 px-2.5 py-2 text-center font-mono text-xs font-medium text-ink transition-colors focus:border-brand-accent focus:outline-none dark:bg-subtle"
      />
    </div>
  );
}

function RgbInputGroup({
  rgb,
  onChangeChannel,
}: {
  rgb: RgbColor;
  onChangeChannel: (channel: keyof RgbColor, raw: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-3 text-left">
        {RGB_CHANNELS.map(({ key, label }) => (
          <label
            key={key}
            htmlFor={`color-picker-${key}`}
            className="text-[11px] font-semibold tracking-wide text-muted uppercase"
          >
            {label}
          </label>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg border border-border bg-subtle/60 focus-within:border-brand-accent dark:bg-subtle">
        {RGB_CHANNELS.map(({ key, ariaLabel }) => (
          <input
            key={key}
            id={`color-picker-${key}`}
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={rgb[key]}
            onChange={(event) => onChangeChannel(key, event.target.value)}
            aria-label={ariaLabel}
            className="w-full bg-transparent px-1 py-2 text-center font-mono text-xs font-medium text-ink focus:outline-none"
          />
        ))}
      </div>
    </div>
  );
}

export function HexRgbInputs({
  hex,
  onCommitHex,
}: {
  hex: string;
  onCommitHex: (nextHex: string) => void;
}) {
  const rgb = hexToRgb(hex);

  function handleChannelChange(channel: keyof RgbColor, raw: string) {
    const digits = raw.replace(/\D/g, '');
    const numeric = digits === '' ? 0 : clamp(Number.parseInt(digits, 10), 0, 255);
    onCommitHex(rgbToHex({ ...rgb, [channel]: numeric }));
  }

  return (
    <div className="mt-3 grid grid-cols-[1.15fr_1.65fr] gap-2.5">
      <HexInputField hex={hex} onCommitHex={onCommitHex} />
      <RgbInputGroup rgb={rgb} onChangeChannel={handleChannelChange} />
    </div>
  );
}
