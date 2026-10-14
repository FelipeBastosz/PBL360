export type PokerOrder = 'SEQUENCIAL' | 'MANUAL';

export type PokerRoundStatus = 'VOTANDO' | 'REVELADA' | 'DECIDIDA';

export type PokerStudent = {
  alunoId: string;
  nome: string;
  iniciais: string;
  fotoUrl: string | null;
  lugar: number | null;
};

export type PokerSeat = {
  lugar: number;
  alunoId: string | null;
  nome: string | null;
  iniciais: string | null;
  avaliado: boolean;
  votou: boolean;
};

export type PokerRevealedVote = {
  lugar: number;
  nota: number;
  alunoId: string | null;
  nome: string | null;
};

export type PokerReveal = {
  votos: PokerRevealedVote[];
  media: number | null;
  totalVotos: number;
  faltaram: number;
};

export type PokerRound = {
  rodadaId: string;
  numero: number;
  status: PokerRoundStatus;
  avaliado: PokerStudent;
  mesa: PokerSeat[];
  votantesEsperados: number;
  votaram: number;
  lugaresQueVotaram: number[];
  revelacao: PokerReveal | null;
  souAvaliado?: boolean;
  meuVoto?: number | null;
  meuLugar?: number | null;
};

export type PokerCompleted = {
  alunoId: string;
  nome: string;
  iniciais: string;
  media?: number | null;
  notaFinal?: number;
  ajustada?: boolean;
};

export type PlanningPokerState = {
  pokerId: string;
  anonimo: boolean;
  ordem: PokerOrder;
  status: string;
  participantes: PokerStudent[];
  ausentes: PokerStudent[];
  fila: string[];
  concluidas: PokerCompleted[];
  rodadaAtual: PokerRound | null;
  participante?: boolean;
};

export type PlanningPokerAvailability = {
  disponivel: boolean;
  motivo: string | null;
  presentes: number;
  pokerAbertoId: string | null;
};

export type StartPlanningPokerPayload = {
  anonimo: boolean;
  ordem: PokerOrder;
};

export type PokerDecisionPayload =
  { acao: 'ACEITAR' } | { acao: 'REAJUSTAR'; nota: number; justificativa: string };

export type PokerVoteEvent = {
  rodadaId: string;
  votaram: number;
  esperados: number;
  lugaresQueVotaram: number[];
};

export type PokerConnection = 'live' | 'reconnecting' | 'error';
