import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';

type LeaveDialogProps = {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export function LeaveDialog({ isOpen, onStay, onLeave }: LeaveDialogProps) {
  return (
    <Sheet isOpen={isOpen} placement="center" title="Sair sem salvar?" onClose={onStay}>
      <p className="text-muted">
        A chamada tem alterações que ainda não foram salvas e serão perdidas.
      </p>
      <div className="mt-5 flex gap-3">
        <Button variant="outline" onClick={onStay} className="flex-1">
          Continuar editando
        </Button>
        <button
          type="button"
          onClick={onLeave}
          className="h-12 flex-1 rounded-xl bg-danger font-semibold text-white transition-[background-color,scale] duration-200 hover:bg-danger/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
        >
          Sair sem salvar
        </button>
      </div>
    </Sheet>
  );
}
