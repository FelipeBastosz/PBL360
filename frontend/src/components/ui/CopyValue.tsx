import { useEffect, useState } from 'react';
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

type CopyValueProps = {
  label: string;
  value: string;
  displayValue?: string;
};

export function CopyValue({ label, value, displayValue }: CopyValueProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm text-brand-900">
      <p className="truncate">
        <span className="font-semibold">{label}:</span>{' '}
        <span className="[font-feature-settings:'calt'_0]">{displayValue ?? value}</span>
      </p>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copiar ${label}`}
        className="shrink-0 rounded-md p-1 transition-[color,scale] duration-200 hover:text-brand-700 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900"
      >
        {copied ? (
          <CheckIcon
            key="copied"
            className="size-5 text-success animate-pop-in"
            strokeWidth={2.5}
          />
        ) : (
          <DocumentDuplicateIcon key="copy" className="size-5 animate-pop-in" />
        )}
      </button>
    </div>
  );
}
