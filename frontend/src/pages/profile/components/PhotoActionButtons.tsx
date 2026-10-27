import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface PhotoActionButtonsProps {
  hasPhoto: boolean;
  isBusy: boolean;
  onPickPhoto: () => void;
  onDeletePhoto: () => void;
}

export function PhotoActionButtons({
  hasPhoto,
  isBusy,
  onPickPhoto,
  onDeletePhoto,
}: PhotoActionButtonsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
      <Button
        type="button"
        variant="outline"
        disabled={isBusy}
        onClick={onPickPhoto}
        className="h-10 w-auto gap-2 px-3 text-xs"
      >
        <CameraIcon className="size-4" aria-hidden />
        {hasPhoto ? 'Alterar foto' : 'Adicionar foto'}
      </Button>

      {hasPhoto && (
        <Button
          type="button"
          variant="link"
          disabled={isBusy}
          onClick={onDeletePhoto}
          className="h-10 w-auto gap-2 px-3 text-xs text-danger hover:text-danger"
        >
          <TrashIcon className="size-4" aria-hidden />
          Remover
        </Button>
      )}
    </div>
  );
}
