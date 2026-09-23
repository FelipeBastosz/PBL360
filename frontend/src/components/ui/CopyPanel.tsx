import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { cn } from '@/utils/cn';

type CopyItem = {
  label: string;
  value: string;
};

type CopyPanelProps = {
  items: CopyItem[];
  className?: string;
};

export function CopyPanel({ items, className }: CopyPanelProps) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  async function handleCopy(item: CopyItem) {
    try {
      await navigator.clipboard.writeText(item.value);
      setCopiedLabel(item.label);
      setTimeout(() => {
        setCopiedLabel((current) => (current === item.label ? null : current));
      }, 1500);
    } catch {
      // Clipboard indisponível neste ambiente; ignora silenciosamente.
    }
  }

  return (
    <div className={cn('flex flex-col gap-3 rounded-[20px] bg-black/5 px-6 py-5', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-center gap-2 text-center">
          <p className="text-base font-bold text-brand-900">
            {item.label}: {item.value}
          </p>
          <button
            type="button"
            onClick={() => handleCopy(item)}
            aria-label={`Copiar ${item.label.toLowerCase()}`}
            className="shrink-0 rounded p-1 text-brand-900 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-brand-900"
          >
            {copiedLabel === item.label ? (
              <CheckIcon className="size-5" aria-hidden />
            ) : (
              <DocumentDuplicateIcon className="size-5" aria-hidden />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
