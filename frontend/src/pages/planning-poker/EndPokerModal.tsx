import { Button } from '@/components/ui/Button';
import { TextLink } from './PokerCard';
import { PokerModal, WarningIcon } from './PokerModal';

type EndPokerModalProps = {
  isOpen: boolean;
  sessionLabel: string;
  pending: number;
  done: number;
  isBusy: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

function endMessage(pending: number, done: number) {
  const title =
    pending > 0
      ? `${pending} ${pending === 1 ? 'aluno ficará' : 'alunos ficarão'} sem nota nesta avaliação.`
      : 'Todos os alunos já foram avaliados.';
  const kept = done > 0 ? `As ${done} notas já definidas serão mantidas.` : '';
  return { title, kept };
}

export function EndPokerModal({
  isOpen,
  sessionLabel,
  pending,
  done,
  isBusy,
  onConfirm,
  onClose,
}: EndPokerModalProps) {
  const { title, kept } = endMessage(pending, done);

  return (
    <PokerModal isOpen={isOpen} label="Encerrar planning poker?" onClose={onClose} danger>
      <div className="flex flex-col items-center gap-4 text-center">
        <WarningIcon tone="danger" />
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-ink">Encerrar planning poker?</h2>
          <p className="text-base font-semibold text-brand-900">{sessionLabel}</p>
          <div className="mt-2 rounded-xl bg-danger/10 p-3">
            <p className="text-sm leading-relaxed font-medium text-danger">
              <strong>{title}</strong> {kept}
            </p>
          </div>
        </div>
        <div className="mt-1 flex w-full flex-col gap-2">
          <Button
            onClick={onConfirm}
            isLoading={isBusy}
            className="bg-danger shadow-none hover:bg-danger/90 focus-visible:outline-danger"
          >
            Sim, encerrar
          </Button>
          <TextLink tone="muted" onClick={onClose}>
            Cancelar
          </TextLink>
        </div>
      </div>
    </PokerModal>
  );
}
