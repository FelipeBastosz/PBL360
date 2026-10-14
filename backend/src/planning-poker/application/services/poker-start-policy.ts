import type { Session } from '@/sessions/domain/entities/session.entity';
import type { ReleaseSubmissions } from '@/sessions/domain/repositories/session.repository';

export enum PokerBlockReason {
  ROLL_CALL_MISSING = 'ROLL_CALL_MISSING',
  PEER_FORM_RELEASED = 'PEER_FORM_RELEASED',
  NOT_ENOUGH_STUDENTS = 'NOT_ENOUGH_STUDENTS',
}

export const POKER_BLOCK_MESSAGES: Record<PokerBlockReason, string> = {
  [PokerBlockReason.ROLL_CALL_MISSING]: 'Salve a chamada para começar.',
  [PokerBlockReason.PEER_FORM_RELEASED]:
    'O formulário de pares já foi liberado nesta sessão. Use um ou outro.',
  [PokerBlockReason.NOT_ENOUGH_STUDENTS]: 'É preciso ao menos dois alunos presentes na chamada.',
};

const MIN_PARTICIPANTS = 2;

export function pokerBlockReason(
  session: Session,
  submissions: ReleaseSubmissions,
): PokerBlockReason | null {
  if (!submissions.rollCallSaved) return PokerBlockReason.ROLL_CALL_MISSING;
  if (session.peerEvalReleased || submissions.peerSubmitted > 0) {
    return PokerBlockReason.PEER_FORM_RELEASED;
  }
  if (submissions.presentStudents < MIN_PARTICIPANTS) return PokerBlockReason.NOT_ENOUGH_STUDENTS;
  return null;
}
