import { Button } from '@/components/ui/Button';

type FormActionsProps = {
  isSubmitting: boolean;
  onCancel: () => void;
};

export function FormActions({ isSubmitting, onCancel }: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="h-11 w-auto rounded-xl border-brand-900 px-4 text-sm font-semibold text-brand-900"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        className="h-11 w-auto rounded-xl px-5 text-sm font-semibold shadow-[0_10px_24px_-8px_rgb(0_0_119/0.55)]"
      >
        Salvar nova senha
      </Button>
    </div>
  );
}
