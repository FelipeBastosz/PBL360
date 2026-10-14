import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { PlanningPokerState, PokerConnection, PokerRound } from '@/types/planningPoker';
import { AverageCenter, EvaluatedCenter, WaitingCenter } from './PokerCenter';
import { AbsentState } from './PokerEmptyState';
import { PokerLayout } from './PokerLayout';
import { PokerStatusBar, ReconnectingNotice } from './PokerStatusBar';
import { anonymousSeats, roundSeats, waitingSeats } from './pokerSeats';
import { PokerTable } from './PokerTable';
import { EvaluatedPanel, RevealNotice, VotedPanel, WaitingNotice } from './StudentPanels';
import type { PokerActions } from './usePokerActions';
import { useWideLayout } from './useWideLayout';
import { VoteScreen } from './VoteScreen';

type StudentPokerScreenProps = {
  state: PlanningPokerState;
  connection: PokerConnection;
  actions: PokerActions;
  onBack: () => void;
};

type StudentPhase = 'wait' | 'vote' | 'voted' | 'evaluated' | 'reveal';

function phaseOf(round: PokerRound | null, isEditing: boolean): StudentPhase {
  if (!round) return 'wait';
  if (round.status === 'REVELADA') return 'reveal';
  if (round.souAvaliado) return 'evaluated';
  return round.meuVoto === null || round.meuVoto === undefined || isEditing ? 'vote' : 'voted';
}

function RoundPanel({
  phase,
  round,
  canChange,
  onChange,
}: {
  phase: StudentPhase;
  round: PokerRound;
  canChange: boolean;
  onChange: () => void;
}) {
  if (phase === 'voted')
    return <VotedPanel round={round} canChange={canChange} onChange={onChange} />;
  if (phase === 'evaluated') return <EvaluatedPanel round={round} />;
  return <RevealNotice round={round} />;
}

function studentTable(state: PlanningPokerState, phase: StudentPhase, myId?: string) {
  const round = state.rodadaAtual;
  if (!round) {
    const grades = new Map(state.concluidas.map((item) => [item.alunoId, undefined]));
    return {
      seats: state.anonimo
        ? anonymousSeats(state.participantes.length)
        : waitingSeats(state.participantes, { grades, myId }),
      center: <WaitingCenter title="Aguarde o tutor abrir a próxima rodada" />,
    };
  }
  return {
    seats: roundSeats(round, { anonymous: state.anonimo, mySeat: round.meuLugar }),
    center:
      phase === 'reveal' ? (
        <AverageCenter average={round.revelacao?.media ?? null} name={round.avaliado.nome} />
      ) : (
        <EvaluatedCenter student={round.avaliado} />
      ),
  };
}

type StudentVoteViewProps = {
  round: PokerRound;
  status: { connection: PokerConnection; anonymous: boolean; roundLabel: string };
  actions: PokerActions;
  onVoted: () => void;
};

function StudentVoteView({ round, status, actions, onVoted }: StudentVoteViewProps) {
  const vote = (nota: number) =>
    void actions.vote(round.rodadaId, nota).then((ok) => ok && onVoted());
  return (
    <>
      <PokerStatusBar {...status} />
      <VoteScreen
        key={round.rodadaId}
        student={round.avaliado}
        initial={round.meuVoto ?? null}
        isBusy={actions.isBusy}
        onVote={vote}
      />
    </>
  );
}

function roundLabelOf(state: PlanningPokerState): string {
  const round = state.rodadaAtual;
  return round ? `Rodada ${round.numero} de ${state.participantes.length}` : 'Entre rodadas';
}

export function StudentPokerScreen({
  state,
  connection,
  actions,
  onBack,
}: StudentPokerScreenProps) {
  const { user } = useAuth();
  const wide = useWideLayout();
  const [editingRound, setEditingRound] = useState<string | null>(null);
  const round = state.rodadaAtual;
  const phase = phaseOf(round, editingRound === round?.rodadaId);
  const isLive = connection === 'live';
  const status = { connection, anonymous: state.anonimo, roundLabel: roundLabelOf(state) };

  if (state.participante === false) return <AbsentState onBack={onBack} />;

  if (phase === 'vote' && round) {
    return (
      <StudentVoteView
        round={round}
        status={status}
        actions={actions}
        onVoted={() => setEditingRound(null)}
      />
    );
  }

  const { seats, center } = studentTable(state, phase, user?.id);

  return (
    <PokerLayout
      {...status}
      wide={wide}
      showShuffle={state.anonimo}
      panelFirst={phase === 'voted' || phase === 'evaluated'}
      table={
        <PokerTable seats={seats} wide={wide}>
          {center}
        </PokerTable>
      }
    >
      {!isLive && <ReconnectingNotice />}
      {!round && <WaitingNotice />}
      {round && (
        <RoundPanel
          phase={phase}
          round={round}
          canChange={isLive}
          onChange={() => setEditingRound(round.rodadaId)}
        />
      )}
    </PokerLayout>
  );
}
