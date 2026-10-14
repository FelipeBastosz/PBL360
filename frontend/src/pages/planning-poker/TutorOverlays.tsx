import type { PlanningPokerState, PokerStudent } from '@/types/planningPoker';
import { AdjustGradeModal } from './AdjustGradeModal';
import { ConfirmRevealModal } from './ConfirmRevealModal';
import { EndPokerModal } from './EndPokerModal';
import { ProgressSheet } from './ProgressSheet';
import { QueueEditorSheet } from './QueueEditorSheet';
import type { PokerActions } from './usePokerActions';

export type TutorOverlay = 'reveal' | 'adjust' | 'end' | 'progress' | 'queue' | null;

type TutorOverlaysProps = {
  state: PlanningPokerState;
  overlay: TutorOverlay;
  queue: PokerStudent[];
  sessionLabel: string;
  actions: PokerActions;
  onClose: () => void;
  onClosed: () => void;
};

function missingNames(state: PlanningPokerState): string[] {
  const round = state.rodadaAtual;
  if (!round || state.anonimo) return [];
  return round.mesa
    .filter((seat) => !seat.avaliado && !seat.votou && seat.nome)
    .map((seat) => seat.nome!);
}

function RoundOverlays({ state, overlay, actions, onClose }: TutorOverlaysProps) {
  const round = state.rodadaAtual;
  const after = (done: boolean) => done && onClose();
  return (
    <>
      <ConfirmRevealModal
        isOpen={overlay === 'reveal' && Boolean(round)}
        missing={round ? round.votantesEsperados - round.votaram : 0}
        missingNames={missingNames(state)}
        isBusy={actions.isBusy}
        onConfirm={() => round && void actions.reveal(round.rodadaId).then(after)}
        onClose={onClose}
      />
      {overlay === 'adjust' && round && (
        <AdjustGradeModal
          studentName={round.avaliado.nome}
          average={round.revelacao?.media ?? null}
          isBusy={actions.isBusy}
          onSave={(nota, text) => void actions.adjust(round.rodadaId, nota, text).then(after)}
          onClose={onClose}
        />
      )}
    </>
  );
}

export function TutorOverlays(props: TutorOverlaysProps) {
  const { state, overlay, queue, actions, onClose } = props;
  const round = state.rodadaAtual;
  const after = (done: boolean) => done && onClose();
  const pending = round ? [round.avaliado, ...queue] : queue;

  return (
    <>
      <RoundOverlays {...props} />
      <EndPokerModal
        isOpen={overlay === 'end'}
        sessionLabel={props.sessionLabel}
        pending={pending.length}
        done={state.concluidas.length}
        isBusy={actions.isBusy}
        onConfirm={() => void actions.close().then((done) => done && props.onClosed())}
        onClose={onClose}
      />
      <ProgressSheet
        isOpen={overlay === 'progress'}
        total={state.participantes.length}
        completed={state.concluidas}
        pending={pending}
        votingId={round?.avaliado.alunoId ?? null}
        absentees={state.ausentes}
        onClose={onClose}
      />
      {overlay === 'queue' && (
        <QueueEditorSheet
          queue={queue}
          isBusy={actions.isBusy}
          onSave={(fila) => void actions.reorder(fila).then(after)}
          onClose={onClose}
        />
      )}
    </>
  );
}
