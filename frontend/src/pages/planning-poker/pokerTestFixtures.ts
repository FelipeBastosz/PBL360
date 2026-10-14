import { vi } from 'vitest';
import type { PlanningPokerState, PokerRound, PokerStudent } from '@/types/planningPoker';
import type { PokerActions } from './usePokerActions';

const NAMES = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Santos'];

export const STUDENTS: PokerStudent[] = NAMES.map((nome, index) => ({
  alunoId: `aluno-${index + 1}`,
  nome,
  iniciais: nome
    .split(' ')
    .map((part) => part[0])
    .join(''),
  fotoUrl: null,
  lugar: index + 1,
}));

export function aRound(overrides: Partial<PokerRound> = {}): PokerRound {
  return {
    rodadaId: 'rodada-1',
    numero: 1,
    status: 'VOTANDO',
    avaliado: STUDENTS[0]!,
    mesa: STUDENTS.map((student, index) => ({
      lugar: index + 1,
      alunoId: student.alunoId,
      nome: student.nome,
      iniciais: student.iniciais,
      avaliado: index === 0,
      votou: index === 1,
    })),
    votantesEsperados: 3,
    votaram: 1,
    lugaresQueVotaram: [2],
    revelacao: null,
    ...overrides,
  };
}

export function aState(overrides: Partial<PlanningPokerState> = {}): PlanningPokerState {
  return {
    pokerId: 'poker-1',
    anonimo: false,
    ordem: 'SEQUENCIAL',
    status: 'ABERTO',
    participantes: STUDENTS,
    ausentes: [],
    fila: STUDENTS.map((student) => student.alunoId),
    concluidas: [],
    rodadaAtual: null,
    participante: true,
    ...overrides,
  };
}

export function anActions(): PokerActions {
  const done = vi.fn().mockResolvedValue(true);
  return {
    isBusy: false,
    openRound: done,
    cancelRound: done,
    reveal: vi.fn().mockResolvedValue(true),
    revote: done,
    accept: vi.fn().mockResolvedValue(true),
    adjust: vi.fn().mockResolvedValue(true),
    reorder: vi.fn().mockResolvedValue(true),
    close: done,
    vote: vi.fn().mockResolvedValue(true),
  };
}
