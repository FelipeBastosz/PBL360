import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import type { UserResponse } from '@/types/auth';
import type { PlanningPokerState } from '@/types/planningPoker';
import { aRound, aState, anActions } from './pokerTestFixtures';
import { StudentPokerScreen } from './StudentPokerScreen';
import type { PokerActions } from './usePokerActions';

vi.mock('@/services/user.service', () => ({
  userService: { getPhoto: vi.fn().mockRejectedValue(new Error('sem foto')) },
}));

const student: UserResponse = {
  id: 'aluno-2',
  nome: 'Bruno Lima',
  email: 'bruno@uefs.br',
  tipo: 'ALUNO',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

function renderStudent(state: PlanningPokerState, actions: PokerActions = anActions()) {
  return render(
    <AuthContext.Provider
      value={{ user: student, isAuthenticated: true, login: vi.fn(), logout: vi.fn() }}
    >
      <StudentPokerScreen state={state} connection="live" actions={actions} onBack={vi.fn()} />
    </AuthContext.Provider>,
  );
}

const votingRound = (meuVoto: number | null) =>
  aState({ rodadaAtual: aRound({ souAvaliado: false, meuVoto, meuLugar: 2 }) });

describe('StudentPokerScreen', () => {
  it('waits for the tutor between rounds', () => {
    renderStudent(aState());

    expect(screen.getByText('Aguarde o tutor abrir a próxima rodada')).toBeInTheDocument();
  });

  it('hides who sits where between anonymous rounds', () => {
    renderStudent(aState({ anonimo: true }));

    expect(screen.getByText('Posições embaralhadas nesta rodada')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /^Lugar \d+$/ })).toHaveLength(4);
    expect(screen.queryByText('Você')).not.toBeInTheDocument();
    expect(screen.queryByText('AS')).not.toBeInTheDocument();
  });

  it('votes with a quick card and the fine adjustment', async () => {
    const actions = anActions();
    renderStudent(votingRound(null), actions);

    expect(
      screen.getByText('Que nota Ana merece pelo desempenho nesta sessão?'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '7,5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar nota' }));
    await userEvent.click(screen.getByRole('button', { name: 'Votar' }));

    expect(actions.vote).toHaveBeenCalledWith('rodada-1', 7.6);
  });

  it('shows the sent vote and lets the student change it', async () => {
    renderStudent(votingRound(8.5));

    expect(
      screen.getByText('Voto enviado — você pode trocar até o tutor revelar'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Trocar voto' }));

    expect(screen.getByRole('button', { name: 'Votar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '8,5' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not offer the vote to the evaluated student', () => {
    renderStudent(aState({ rodadaAtual: aRound({ souAvaliado: true, meuLugar: 1 }) }));

    expect(screen.getByText('Você está sendo avaliado nesta rodada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Votar' })).not.toBeInTheDocument();
  });

  it('reveals the cards anonymously without the final grade', () => {
    const round = aRound({
      status: 'REVELADA',
      meuLugar: 3,
      mesa: aRound().mesa.map((seat) => ({
        ...seat,
        alunoId: seat.avaliado ? seat.alunoId : null,
        nome: seat.avaliado ? seat.nome : null,
      })),
      revelacao: {
        votos: [
          { lugar: 2, nota: 7, alunoId: null, nome: null },
          { lugar: 3, nota: 9, alunoId: null, nome: null },
        ],
        media: 8,
        totalVotos: 2,
        faltaram: 1,
      },
    });
    renderStudent(aState({ anonimo: true, rodadaAtual: round }));

    expect(screen.getByText('8,0')).toBeInTheDocument();
    expect(screen.getByText('Você')).toBeInTheDocument();
    expect(screen.queryByText('Carla')).not.toBeInTheDocument();
    expect(screen.getByText(/A nota final é definida pelo tutor/)).toBeInTheDocument();
  });

  it('tells an absent student that they did not take part', () => {
    renderStudent(aState({ participante: false }));

    expect(screen.getByText('Você não participou desta sessão')).toBeInTheDocument();
  });
});
