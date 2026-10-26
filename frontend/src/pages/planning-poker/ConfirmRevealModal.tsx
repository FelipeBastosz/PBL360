import { Button } from '@/components/ui/Button';
import { firstName, joinNames } from '@/utils/pokerFormat';
import { TextLink } from './PokerCard';
import { PokerModal, WarningIcon } from './PokerModal';

type ConfirmRevealModalProps = {
  isOpen: boolean;
  missing: number;
  missingNames: string[];
  isBusy: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmRevealModal({
  isOpen,
  missing,
  missingNames,
  isBusy,
  onConfirm,
  onClose,
}: ConfirmRevealModalProps) {
  const title = missing === 1 ? '1 aluno ainda não votou' : `${missing} alunos ainda não votaram`;
  const names = missingNames.length ? `Faltam ${joinNames(missingNames.map(firstName))}. ` : '';

  return (
    <PokerModal isOpen={isOpen} label="Revelar votos agora?" onClose={onClose}>
      <div className="flex flex-col items-center gap-4 text-center">
        <WarningIcon tone="warning" />
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-ink">Revelar votos agora?</h2>
          <p className="text-base font-semibold text-brand-900">{title}</p>
          <p className="text-sm leading-normal text-pretty text-muted">
            {names}Quem não votou fica fora da média desta rodada.
          </p>
        </div>
        <div className="mt-1 flex w-full flex-col gap-2">
          <Button onClick={onConfirm} isLoading={isBusy}>
            Revelar mesmo assim
          </Button>
          <TextLink tone="muted" onClick={onClose}>
            Cancelar
          </TextLink>
        </div>
      </div>
    </PokerModal>
  );
}
