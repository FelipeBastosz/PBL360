import { useId, useRef } from 'react';
import { CameraIcon, CheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { useDataUrl } from '@/hooks/useDataUrl';
import { cn } from '@/utils/cn';
import { PHOTO_TYPES } from '@/utils/validation';

type AvatarPickerProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
};

function AvatarDisc({ preview, hasError }: { preview: string | null; hasError: boolean }) {
  return (
    <span className="relative block size-28 animate-pop-in">
      <span
        key={preview ?? 'empty'}
        aria-hidden
        className="absolute inset-0 rounded-full border-2 border-brand-900/40 animate-ring"
      />
      <span
        className={cn(
          'relative flex size-full items-center justify-center overflow-hidden rounded-full border-2 bg-brand-100 transition-transform duration-300 ease-out group-hover:scale-[1.04] group-active:scale-95',
          hasError ? 'border-danger' : 'border-brand-900',
        )}
      >
        {preview ? (
          <img
            key={preview}
            src={preview}
            alt=""
            className="size-full object-cover animate-develop"
          />
        ) : (
          <UserIcon className="size-16 text-brand-900" strokeWidth={1.4} aria-hidden />
        )}
      </span>
      <CameraBadge done={Boolean(preview)} />
    </span>
  );
}

function CameraBadge({ done }: { done: boolean }) {
  const Icon = done ? CheckIcon : CameraIcon;

  return (
    <span className="absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full bg-brand-900 text-white ring-4 ring-surface transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110">
      <Icon
        key={done ? 'done' : 'camera'}
        className="size-5 animate-pop-in"
        strokeWidth={done ? 2.5 : 1.8}
        aria-hidden
      />
    </span>
  );
}

function AvatarCaption({ hasPhoto, optional }: { hasPhoto: boolean; optional?: boolean }) {
  return (
    <span className="text-lg text-brand-900">
      {hasPhoto ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
      {optional && (
        <>
          {' '}
          <span className="text-brand-300">(opcional)</span>
        </>
      )}
    </span>
  );
}

export function AvatarPicker({ value, onChange, error, hint, optional }: AvatarPickerProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useDataUrl(value);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col items-center text-center">
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        tabIndex={-1}
        className="sr-only"
        aria-label="Foto de perfil"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-describedby={describedBy}
        className={cn(
          'group flex flex-col items-center gap-3 rounded-2xl p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900',
          error && 'animate-shake',
        )}
      >
        <AvatarDisc preview={preview} hasError={Boolean(error)} />
        <AvatarCaption hasPhoto={Boolean(value)} optional={optional} />
      </button>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger animate-slide-down">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-brand-300">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
