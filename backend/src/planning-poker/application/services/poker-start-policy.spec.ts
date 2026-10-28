import { Session } from '@/sessions/domain/entities/session.entity';
import { pokerBlockReason, PokerBlockReason, POKER_BLOCK_MESSAGES } from './poker-start-policy';

const mockSession = (overrides: Partial<Session> = {}): Session =>
  Object.assign(new Session(), {
    id: 'session-1',
    selfEvalReleased: false,
    peerEvalReleased: false,
    ...overrides,
  });

describe('pokerBlockReason', () => {
  const baseSubmissions = {
    rollCallSaved: true,
    presentStudents: 3,
    selfSubmitted: 0,
    peerSubmitted: 0,
    tutorSubmitted: 0,
  };

  it('blocks when roll call was not saved', () => {
    const reason = pokerBlockReason(mockSession(), {
      ...baseSubmissions,
      rollCallSaved: false,
    });
    expect(reason).toBe(PokerBlockReason.ROLL_CALL_MISSING);
    expect(POKER_BLOCK_MESSAGES[reason!]).toBe('Salve a chamada para começar.');
  });

  it('blocks when tutor already submitted evaluations', () => {
    const reason = pokerBlockReason(mockSession(), {
      ...baseSubmissions,
      tutorSubmitted: 1,
    });
    expect(reason).toBe(PokerBlockReason.TUTOR_EVALUATED);
    expect(POKER_BLOCK_MESSAGES[reason!]).toBe(
      'A sessão já possui avaliações do tutor submetidas.',
    );
  });

  it('blocks when self-assessment was released', () => {
    const reason = pokerBlockReason(mockSession({ selfEvalReleased: true }), baseSubmissions);
    expect(reason).toBe(PokerBlockReason.SELF_EVAL_ACTIVE);
    expect(POKER_BLOCK_MESSAGES[reason!]).toBe(
      'A autoavaliação já foi liberada nesta sessão. Use uma ou outra.',
    );
  });

  it('blocks when self-assessment was submitted', () => {
    const reason = pokerBlockReason(mockSession(), {
      ...baseSubmissions,
      selfSubmitted: 1,
    });
    expect(reason).toBe(PokerBlockReason.SELF_EVAL_ACTIVE);
  });

  it('blocks when peer form was released', () => {
    const reason = pokerBlockReason(mockSession({ peerEvalReleased: true }), baseSubmissions);
    expect(reason).toBe(PokerBlockReason.PEER_FORM_RELEASED);
    expect(POKER_BLOCK_MESSAGES[reason!]).toBe(
      'O formulário de pares já foi liberado nesta sessão. Use um ou outro.',
    );
  });

  it('blocks when peer form evaluations were submitted', () => {
    const reason = pokerBlockReason(mockSession(), {
      ...baseSubmissions,
      peerSubmitted: 2,
    });
    expect(reason).toBe(PokerBlockReason.PEER_FORM_RELEASED);
  });

  it('blocks when there are fewer than 2 present students', () => {
    const reason = pokerBlockReason(mockSession(), {
      ...baseSubmissions,
      presentStudents: 1,
    });
    expect(reason).toBe(PokerBlockReason.NOT_ENOUGH_STUDENTS);
    expect(POKER_BLOCK_MESSAGES[reason!]).toBe(
      'É preciso ao menos dois alunos presentes na chamada.',
    );
  });

  it('returns null when all conditions are satisfied', () => {
    const reason = pokerBlockReason(mockSession(), baseSubmissions);
    expect(reason).toBeNull();
  });
});
