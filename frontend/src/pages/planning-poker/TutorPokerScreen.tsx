import { useState } from 'react';
import type { PlanningPokerState, PokerConnection, PokerStudent } from '@/types/planningPoker';
import { firstName } from '@/utils/pokerFormat';
import { AverageCenter, EvaluatedCenter, WaitingCenter } from './PokerCenter';
import { PokerLayout } from './PokerLayout';
import { ReconnectingNotice } from './PokerStatusBar';
import { pendingStudents, roundSeats, waitingSeats } from './pokerSeats';
import { PokerTable } from './PokerTable';
import { TutorOverlays, type TutorOverlay } from './TutorOverlays';
import { TutorRevealPanel, TutorVotingPanel } from './TutorRoundPanels';
import { TutorWaitingPanel } from './TutorWaitingPanel';
import type { PokerActions } from './usePokerActions';
import { useWideLayout } from './useWideLayout';

type TutorPokerScreenProps = {
  state: PlanningPokerState;
  connection: PokerConnection;
  sessionLabel: string;
  actions: PokerActions;
  onClosed: () => void;
};

function useTutorTable(state: PlanningPokerState, actions: PokerActions) {
  const round = state.rodadaAtual;
  const queue = pendingStudents(state);
  const grades = new Map(state.concluidas.map((item) => [item.alunoId, item.notaFinal]));
  const onChoose =
    state.ordem === 'MANUAL' ? (id: string) => void actions.openRound(id) : undefined;
  const seats = round
    ? roundSeats(round, { anonymous: state.anonimo })
    : waitingSeats(state.participantes, { grades, onChoose });
  return { round, queue, seats };
}

function waitingCenterText(state: PlanningPokerState, queue: PokerStudent[]) {
  if (queue.length === 0) return { title: 'Todos avaliados' };
  if (state.ordem === 'MANUAL')
    return { title: 'Escolha o aluno', subtitle: 'na mesa ou na lista' };
  return {
    title: `Pronto para a rodada ${state.concluidas.length + 1}`,
    subtitle: `Próximo: ${firstName(queue[0]!.nome)}`,
  };
}

type TutorPanelProps = {
  state: PlanningPokerState;
  queue: PokerStudent[];
  isLive: boolean;
  actions: PokerActions;
  open: (overlay: TutorOverlay) => void;
};

function TutorPanel({ state, queue, isLive, actions, open }: TutorPanelProps) {
  const round = state.rodadaAtual;
  if (!round) {
    return (
      <TutorWaitingPanel
        order={state.ordem}
        queue={queue}
        doneCount={state.concluidas.length}
        total={state.participantes.length}
        isBusy={actions.isBusy}
        onNext={() => void actions.openRound()}
        onChoose={(id) => void actions.openRound(id)}
        onEditQueue={() => open('queue')}
        onEnd={() => open('end')}
      />
    );
  }
  if (round.status === 'VOTANDO') {
    const missing = round.votaram < round.votantesEsperados;
    return (
      <TutorVotingPanel
        round={round}
        canReveal={isLive && round.votaram > 0}
        isBusy={actions.isBusy}
        onReveal={() => (missing ? open('reveal') : void actions.reveal(round.rodadaId))}
        onCancel={() => void actions.cancelRound(round.rodadaId)}
      />
    );
  }
  return (
    <TutorRevealPanel
      round={round}
      isBusy={actions.isBusy}
      onAccept={() => void actions.accept(round.rodadaId)}
      onAdjust={() => open('adjust')}
      onRevote={() => void actions.revote(round.rodadaId)}
    />
  );
}

export function TutorPokerScreen(props: TutorPokerScreenProps) {
  const { state, connection, actions } = props;
  const wide = useWideLayout();
  const [overlay, setOverlay] = useState<TutorOverlay>(null);
  const { round, queue, seats } = useTutorTable(state, actions);
  const total = state.participantes.length;
  const isLive = connection === 'live';

  const center = !round ? (
    <WaitingCenter {...waitingCenterText(state, queue)} />
  ) : round.status === 'VOTANDO' ? (
    <EvaluatedCenter student={round.avaliado} />
  ) : (
    <AverageCenter average={round.revelacao?.media ?? null} name={round.avaliado.nome} />
  );

  return (
    <PokerLayout
      wide={wide}
      connection={connection}
      anonymous={state.anonimo}
      showShuffle={state.anonimo && Boolean(round)}
      roundLabel={
        round
          ? `Rodada ${round.numero} de ${total}`
          : `${state.concluidas.length} de ${total} avaliados`
      }
      onOpenProgress={() => setOverlay('progress')}
      table={
        <PokerTable seats={seats} wide={wide}>
          {center}
        </PokerTable>
      }
    >
      {!isLive && <ReconnectingNotice />}
      <TutorPanel state={state} queue={queue} isLive={isLive} actions={actions} open={setOverlay} />
      <TutorOverlays {...props} overlay={overlay} queue={queue} onClose={() => setOverlay(null)} />
    </PokerLayout>
  );
}
