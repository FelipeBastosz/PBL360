import type { CSSProperties } from 'react';
import { formatWeight } from '@/utils/formula';

type WeightSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

const THUMB =
  '[&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00003d] [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#00003d]';

export function WeightSlider({ label, value, onChange }: WeightSliderProps) {
  const fill: CSSProperties = {
    background: `linear-gradient(to right, var(--color-brand-900) ${value}%, #e4e4e9 ${value}%)`,
  };

  return (
    <label className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgb(16_33_76/0.06)]">
      <span className="flex items-center justify-between text-lg font-semibold text-brand-900">
        <span>{label}</span>
        <span className="tabular-nums">{formatWeight(value)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={fill}
        className={`h-4 w-full cursor-pointer appearance-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-900 ${THUMB}`}
      />
    </label>
  );
}
