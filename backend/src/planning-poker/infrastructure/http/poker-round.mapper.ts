import type {
  PokerStudent,
  RoundReveal,
  RoundView,
  StudentRoundView,
  TableSeat,
} from '../../application/services/poker-views';
import {
  PokerRoundStatusPayload,
  type PokerRevealResponseDto,
  type PokerRoundResponseDto,
  type PokerSeatResponseDto,
  type PokerStudentResponseDto,
  type StudentPokerRoundResponseDto,
} from '../../application/dtos/poker-round-response.dto';
import { PokerRoundStatus } from '../../domain/entities/poker-round';

const STATUS: Record<PokerRoundStatus, PokerRoundStatusPayload> = {
  [PokerRoundStatus.VOTING]: PokerRoundStatusPayload.VOTANDO,
  [PokerRoundStatus.REVEALED]: PokerRoundStatusPayload.REVELADA,
  [PokerRoundStatus.DECIDED]: PokerRoundStatusPayload.DECIDIDA,
};

export const toPokerStudentResponse = (student: PokerStudent): PokerStudentResponseDto => ({
  alunoId: student.id,
  nome: student.name,
  iniciais: student.initials,
  fotoUrl: student.hasPhoto ? `/usuarios/${student.id}/foto` : null,
  lugar: student.seatNumber,
});

const toSeatResponse = (seat: TableSeat): PokerSeatResponseDto => ({
  lugar: seat.seat,
  alunoId: seat.student?.id ?? null,
  nome: seat.student?.name ?? null,
  iniciais: seat.student?.initials ?? null,
  avaliado: seat.evaluated,
  votou: seat.voted,
});

export const toPokerRevealResponse = (reveal: RoundReveal): PokerRevealResponseDto => ({
  votos: reveal.votes.map((vote) => ({
    lugar: vote.seat,
    nota: vote.score,
    alunoId: vote.student?.id ?? null,
    nome: vote.student?.name ?? null,
  })),
  media: reveal.average,
  totalVotos: reveal.totalVotes,
  faltaram: reveal.missing,
});

export const toPokerRoundResponse = (round: RoundView): PokerRoundResponseDto => ({
  rodadaId: round.roundId,
  numero: round.number,
  status: STATUS[round.status],
  avaliado: toPokerStudentResponse(round.evaluated),
  mesa: round.table.map(toSeatResponse),
  votantesEsperados: round.expectedVoters,
  votaram: round.votedSeats.length,
  lugaresQueVotaram: round.votedSeats,
  revelacao: round.reveal ? toPokerRevealResponse(round.reveal) : null,
});

export const toStudentPokerRoundResponse = (
  round: StudentRoundView,
): StudentPokerRoundResponseDto => ({
  ...toPokerRoundResponse(round),
  souAvaliado: round.isEvaluated,
  meuVoto: round.myVote,
  meuLugar: round.mySeat,
});
