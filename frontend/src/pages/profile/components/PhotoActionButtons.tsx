import { TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface PhotoActionButtonsProps {
  hasPhoto: boolean;
  canDeletePhoto: boolean;
  isBusy: boolean;
  onDeletePhoto: () => void;
}

export function PhotoActionButtons({
  hasPhoto,
  canDeletePhoto,
  isBusy,
  onDeletePhoto,
}: PhotoActionButtonsProps) {
  if (!hasPhoto || !canDeletePhoto) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-center pt-0.5 sm:justify-start">
      <Button
        type="button"
        variant="link"
        disabled={isBusy}
        onClick={onDeletePhoto}
        className="h-auto gap-1.5 p-0 text-xs font-semibold text-danger hover:text-danger hover:underline"
      >
        <TrashIcon className="size-3.5" aria-hidden />
        Remover foto
      </Button>
    </div>
  );
}
