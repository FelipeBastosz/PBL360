import { Button } from '@/components/ui/Button';

type FeedbackFormActionsProps = {
  lastEditedText: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
};

export function FeedbackFormActions({
  lastEditedText,
  isSubmitting,
  onCancel,
}: FeedbackFormActionsProps) {
  return (
    <div className="mt-2 flex flex-col gap-3 pt-2">
      {lastEditedText && <p className="text-sm text-gray-500">Última edição: {lastEditedText}</p>}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
          className="h-11 w-auto px-5 text-sm"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="h-11 w-auto px-6 text-sm"
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
