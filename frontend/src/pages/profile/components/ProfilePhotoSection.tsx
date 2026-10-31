import { useRef, useState, type ChangeEvent } from 'react';
import type { UserProfileResponse } from '@/types/user';
import { ProfilePhotoAvatar } from './ProfilePhotoAvatar';
import { PhotoActionButtons } from './PhotoActionButtons';

interface ProfilePhotoSectionProps {
  profile: UserProfileResponse;
  onUpload: (file: File) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}

function PhotoHelpText({ hasPhoto }: { hasPhoto: boolean }) {
  return (
    <>
      <p className="text-sm font-medium text-brand-900">
        Clique no ícone de câmera para {hasPhoto ? 'alterar' : 'adicionar'} sua foto.
      </p>
      <p className="text-xs text-brand-300">Formatos aceitos: JPG, PNG ou WebP (máx. 2 MB).</p>
    </>
  );
}

export function ProfilePhotoSection({ profile, onUpload, onDelete }: ProfilePhotoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBusy(true);
    try {
      await onUpload(file);
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setIsBusy(true);
    try {
      await onDelete();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 sm:flex-row sm:items-center sm:gap-6">
      <ProfilePhotoAvatar
        profile={profile}
        isBusy={isBusy}
        onPickPhoto={() => fileInputRef.current?.click()}
      />

      <div className="flex flex-col items-center gap-2 sm:items-start">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
          data-testid="photo-input"
        />

        <PhotoHelpText hasPhoto={profile.possuiFoto} />

        <PhotoActionButtons
          hasPhoto={profile.possuiFoto}
          canDeletePhoto={profile.tipo !== 'ALUNO'}
          isBusy={isBusy}
          onDeletePhoto={handleDelete}
        />
      </div>
    </div>
  );
}
