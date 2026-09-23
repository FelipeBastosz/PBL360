import type { ReactNode } from 'react';

type SelectableCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  isSelected?: boolean;
  onSelect: () => void;
};

export function SelectableCard({
  icon,
  title,
  subtitle,
  isSelected = false,
  onSelect,
}: SelectableCardProps) {
  const containerClasses = isSelected
    ? 'bg-brand-500 text-white border-brand-500'
    : 'bg-white text-brand-500 border-gray-200';
  const iconClasses = isSelected ? 'bg-white/20' : 'bg-gray-100';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center w-full gap-3 p-4 text-left border rounded-2xl ${containerClasses}`}
    >
      <span
        className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${iconClasses}`}
      >
        {icon}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className={`block text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
          {subtitle}
        </span>
      </span>
    </button>
  );
}
