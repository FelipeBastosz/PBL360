import { useState } from 'react';
import { hexToHsv, hsvToHex, type HsvColor } from '@/utils/colorMath';
import { normalizeHexColor } from '@/utils/themePalette';
import { ColorSpectrumArea, EyedropperButton, HueSlider } from './ColorPickerControls';
import { HexRgbInputs } from './ColorPickerInputs';

function useColorPickerHsv(
  normalized: string,
  onPreview: (hex: string) => void,
  onCommit: (hex: string) => void,
) {
  const [draft, setDraft] = useState<{ source: string; hsv: HsvColor } | null>(null);
  const hsv = draft?.source === normalized ? draft.hsv : hexToHsv(normalized);

  const previewHsv = (next: HsvColor) => {
    setDraft({ source: normalized, hsv: next });
    onPreview(hsvToHex(next));
  };

  const commitHsv = (next: HsvColor) => {
    setDraft({ source: normalized, hsv: next });
    onCommit(hsvToHex(next));
  };

  const commitDirectHex = (rawHex: string) => {
    const nextHex = normalizeHexColor(rawHex);
    setDraft({ source: normalized, hsv: hexToHsv(nextHex) });
    onCommit(nextHex);
  };

  return { hsv, currentHex: hsvToHex(hsv), previewHsv, commitHsv, commitDirectHex };
}

export function ColorPicker({
  selectedHex,
  onPreview,
  onCommit,
}: {
  selectedHex: string;
  onPreview: (hex: string) => void;
  onCommit: (hex: string) => void;
}) {
  const normalized = normalizeHexColor(selectedHex);
  const { hsv, currentHex, previewHsv, commitHsv, commitDirectHex } = useColorPickerHsv(
    normalized,
    onPreview,
    onCommit,
  );

  return (
    <div className="mt-4">
      <p id="appearance-color-label" className="text-xs font-semibold text-muted">
        Cor do sistema
      </p>
      <div
        role="group"
        aria-labelledby="appearance-color-label"
        className="mt-2 rounded-2xl border border-border-subtle bg-card p-3 shadow-xs dark:bg-surface/60"
      >
        <ColorSpectrumArea
          hsv={hsv}
          currentHex={currentHex}
          onChange={previewHsv}
          onCommit={commitHsv}
        />
        <div className="mt-3 flex items-center gap-3">
          <EyedropperButton hex={currentHex} onPick={commitDirectHex} />
          <div className="flex flex-1 flex-col gap-2">
            <HueSlider
              hue={hsv.h}
              onChange={(h) => previewHsv({ ...hsv, h })}
              onCommit={(h) => commitHsv({ ...hsv, h })}
            />
          </div>
        </div>
        <HexRgbInputs hex={currentHex} onCommitHex={commitDirectHex} />
      </div>
    </div>
  );
}
