import { CameraIcon, UserIcon } from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

export function AvatarPicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="flex items-center justify-center overflow-hidden bg-brand-50 border-2 border-brand-500 rounded-full w-28 h-28">
          {preview ? (
            <img
              src={preview}
              alt="Prévia da foto de perfil"
              className="object-cover w-full h-full"
            />
          ) : (
            <UserIcon className="w-14 h-14 text-brand-500" />
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Adicionar foto de perfil"
          className="absolute bottom-0 right-0 flex items-center justify-center text-white rounded-full w-8 h-8 bg-brand-500"
        >
          <CameraIcon className="w-4 h-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFileChange(event.target.files?.[0])}
        />
      </div>
      <p className="text-sm text-brand-500">Adicionar foto de perfil</p>
    </div>
  );
}
