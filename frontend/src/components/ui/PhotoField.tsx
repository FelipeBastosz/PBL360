import { useId, useRef } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { useDataUrl } from '@/hooks/useDataUrl';
import { cn } from '@/utils/cn';
import { PHOTO_TYPES } from '@/utils/validation';

type PhotoFieldProps = {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  hint?: string;
};

function PhotoPreview({ file, hasError }: { file: File | null; hasError: boolean }) {
  const preview = useDataUrl(file);

  return (
    <div
      className={cn(
        'flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-brand-50',
        hasError ? 'border-danger' : 'border-black/20',
      )}
    >
      {preview ? (
        <img src={preview} alt="Pré-visualização da foto" className="size-full object-cover" />
      ) : (
        <UserIcon className="size-10 text-placeholder" aria-hidden />
      )}
    </div>
  );
}

export function PhotoField({ label, value, onChange, error, hint }: PhotoFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-lg text-brand-900">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        tabIndex={-1}
        className="sr-only"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <div className="flex items-center gap-4">
        <PhotoPreview file={value} hasError={Boolean(error)} />
        <div className="flex min-w-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-describedby={describedBy || undefined}
            className="self-start rounded-[10px] border border-brand-900 bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-900"
          >
            {value ? 'Trocar foto' : 'Escolher foto'}
          </button>
          {value && <p className="truncate text-sm text-muted">{value.name}</p>}
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-brand-300">
          {hint}
        </p>
      )}
    </div>
  );
}
