import { useRef, useState, type ChangeEvent } from 'react';
import type { UserProfileResponse } from '@/types/user';
import { ProfilePhotoAvatar } from './ProfilePhotoAvatar';
import { PhotoActionButtons } from './PhotoActionButtons';

interface ProfilePhotoSectionProps {
  profile: UserProfileResponse;
  onUpload: (file: File) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
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
    <div className="flex flex-col items-center gap-4 py-4 sm:flex-row sm:items-center sm:gap-6">
      <ProfilePhotoAvatar profile={profile} isBusy={isBusy} />

      <div className="flex flex-col items-center gap-2 sm:items-start">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
          data-testid="photo-input"
        />

        <PhotoActionButtons
          hasPhoto={profile.possuiFoto}
          isBusy={isBusy}
          onPickPhoto={() => fileInputRef.current?.click()}
          onDeletePhoto={handleDelete}
        />

        <p className="text-xs text-muted">Formatos aceitos: JPG, PNG ou WebP (máx. 2 MB).</p>
      </div>
    </div>
  );
}
