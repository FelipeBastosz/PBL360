import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PlanningPokerState } from '@/types/planningPoker';
import { aRound, aState, anActions, STUDENTS } from './pokerTestFixtures';
import { TutorPokerScreen } from './TutorPokerScreen';
import type { PokerActions } from './usePokerActions';

vi.mock('@/services/user.service', () => ({
  userService: { getPhoto: vi.fn().mockRejectedValue(new Error('sem foto')) },
}));

function renderTutor(state: PlanningPokerState, actions: PokerActions = anActions()) {
  return render(
    <TutorPokerScreen
      state={state}
      connection="live"
      sessionLabel="Sessão 3 · 12 out"
      actions={actions}
      onClosed={vi.fn()}
    />,
  );
}

const revealed = (anonimo = false) =>
  aState({
    anonimo,
    rodadaAtual: aRound({
      status: 'REVELADA',
      votaram: 2,
      revelacao: {
        votos: [
          {
            lugar: 2,
            nota: 8,
            alunoId: anonimo ? null : 'aluno-2',
            nome: anonimo ? null : 'Bruno Lima',
          },
          {
            lugar: 3,
            nota: 9,
            alunoId: anonimo ? null : 'aluno-3',
            nome: anonimo ? null : 'Carla Mendes',
          },
        ],
        media: 8.5,
        totalVotos: 2,
        faltaram: 1,
      },
    }),
  });

describe('TutorPokerScreen', () => {
  it('shows the next student and opens the round in sequential mode', async () => {
    const actions = anActions();
    renderTutor(aState(), actions);

    expect(screen.getByText('Pronto para a rodada 1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Próximo aluno' }));

    expect(actions.openRound).toHaveBeenCalledWith();
  });

  it('lets the tutor reorder the queue', async () => {
    const actions = anActions();
    renderTutor(aState(), actions);

    await userEvent.click(screen.getByRole('button', { name: 'Editar fila' }));
    await userEvent.click(screen.getByRole('button', { name: 'Subir Carla Mendes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar fila' }));

    expect(actions.reorder).toHaveBeenCalledWith(['aluno-1', 'aluno-3', 'aluno-2', 'aluno-4']);
  });

  it('counts the votes as they arrive without showing scores', () => {
    renderTutor(aState({ rodadaAtual: aRound() }));

    expect(screen.getByText(/de 3 votaram/)).toHaveTextContent('1 de 3 votaram');
    expect(screen.getByRole('img', { name: 'Bruno Lima, já votou' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Carla Mendes, aguardando voto' })).toBeInTheDocument();
  });

  it('asks for confirmation before revealing with missing votes', async () => {
    const actions = anActions();
    renderTutor(aState({ rodadaAtual: aRound() }), actions);

    await userEvent.click(screen.getByRole('button', { name: 'Revelar votos' }));
    const dialog = screen.getByRole('dialog', { name: 'Revelar votos agora?' });
    expect(within(dialog).getByText('2 alunos ainda não votaram')).toBeInTheDocument();
    expect(within(dialog).getByText(/Faltam Carla e Diego/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revelar mesmo assim' }));

    expect(actions.reveal).toHaveBeenCalledWith('rodada-1');
  });

  it('shows the average and the cards after the reveal', () => {
    renderTutor(revealed());

    expect(screen.getByText('8,50')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Lugar 2: 8' })).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
  });

  it('requires a justification to adjust the grade', async () => {
    const actions = anActions();
    renderTutor(revealed(), actions);

    await userEvent.click(screen.getByRole('button', { name: 'Reajustar nota' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nota ajustada' }));
    expect(screen.getByText('Mínimo de 10 caracteres.')).toBeInTheDocument();
    expect(actions.adjust).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar nota' }));
    await userEvent.type(
      screen.getByPlaceholderText('Motivo do ajuste da nota...'),
      'Conduziu a síntese.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nota ajustada' }));

    expect(actions.adjust).toHaveBeenCalledWith('rodada-1', 8.6, 'Conduziu a síntese.');
  });

  it('hides who voted in anonymous mode', () => {
    renderTutor(revealed(true));

    expect(screen.getByText('Posições embaralhadas nesta rodada')).toBeInTheDocument();
    expect(screen.queryByText('Bruno')).not.toBeInTheDocument();
    expect(screen.queryByText('Carla')).not.toBeInTheDocument();
  });

  it('warns how many students stay without a grade when ending', async () => {
    renderTutor(aState({ fila: STUDENTS.slice(1).map((student) => student.alunoId) }));

    await userEvent.click(screen.getByRole('button', { name: 'Encerrar planning poker' }));

    expect(screen.getByText('3 alunos ficarão sem nota nesta avaliação.')).toBeInTheDocument();
  });
});
