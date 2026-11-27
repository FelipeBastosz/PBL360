import type { EntityManager } from 'typeorm';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import {
  FIND_EVALUATION_ADJUSTMENTS,
  FIND_PEER_FORM_ADJUSTMENTS,
  FIND_PEER_FORM_SCORES,
  FIND_POKER_ADJUSTMENTS,
  FIND_POKER_ROUND_SCORE,
  FIND_SELF_ASSESSMENT_SCORE,
  FIND_SESSION_EVALUATION_RELEASES,
  LOCK_PEER_FORM_SCORES,
  LOCK_POKER_ROUND_SCORE,
  LOCK_SELF_ASSESSMENT_SCORE,
} from './self-assessment-adjustment.queries';
import { resolveAndReadHistory, toAdjustment } from './self-assessment-adjustment.reads';

const adjustment = {
  previousValue: '7.25',
  newValue: '8.5',
  justification: 'Revisão',
  authorId: 'tutor-1',
  authorName: 'Tutor',
  createdAt: new Date('2026-10-01T12:00:00Z'),
};

function managerFor(results: Record<string, unknown[][]>) {
  const query = jest.fn((sql: string) => Promise.resolve(results[sql] ?? []));
  return { manager: { query } as unknown as EntityManager, query };
}

describe('resolveAndReadHistory', () => {
  it('resolves a released self-assessment and reads its adjustments', async () => {
    const { manager, query } = managerFor({
      [FIND_SESSION_EVALUATION_RELEASES]: [{ selfEvalReleased: true, peerEvalReleased: true }],
      [FIND_SELF_ASSESSMENT_SCORE]: [
        { id: 'evaluation-1', status: EvaluationStatus.SUBMITTED, sessionScore: '7.25' },
      ],
      [FIND_EVALUATION_ADJUSTMENTS]: [adjustment],
    });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', false),
    ).resolves.toMatchObject({
      evaluationId: 'evaluation-1',
      originalScore: 7.25,
      tipo: 'AUTOAVALIACAO',
      adjustments: [{ previousValue: 7.25, newValue: 8.5 }],
    });
    expect(query).toHaveBeenCalledWith(FIND_SELF_ASSESSMENT_SCORE, ['session-1', 'student-1']);
  });

  it('uses locks for explicit self-assessment reads and returns null when no record exists', async () => {
    const { manager, query } = managerFor({ [LOCK_SELF_ASSESSMENT_SCORE]: [] });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', true, 'AUTOAVALIACAO'),
    ).resolves.toBeNull();
    expect(query).toHaveBeenCalledWith(LOCK_SELF_ASSESSMENT_SCORE, ['session-1', 'student-1']);
  });

  it('detects self-assessment modality from an existing student evaluation', async () => {
    const { manager, query } = managerFor({
      [FIND_SESSION_EVALUATION_RELEASES]: [{ selfEvalReleased: false, peerEvalReleased: false }],
      [FIND_SELF_ASSESSMENT_SCORE]: [
        { id: 'self-1', status: EvaluationStatus.SUBMITTED, sessionScore: null },
      ],
      [FIND_EVALUATION_ADJUSTMENTS]: [],
    });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', false),
    ).resolves.toMatchObject({
      evaluationId: 'self-1',
      originalScore: null,
      tipo: 'AUTOAVALIACAO',
    });
    expect(query).not.toHaveBeenCalledWith(FIND_POKER_ROUND_SCORE, expect.anything());
  });

  it('detects peer modality from poker and peer-form histories when no release is set', async () => {
    const poker = managerFor({
      [FIND_SESSION_EVALUATION_RELEASES]: [{ selfEvalReleased: false, peerEvalReleased: false }],
      [FIND_SELF_ASSESSMENT_SCORE]: [],
      [FIND_POKER_ROUND_SCORE]: [{ id: 'round-1', status: 'DECIDED', sessionScore: null }],
      [FIND_POKER_ADJUSTMENTS]: [],
    });
    await expect(
      resolveAndReadHistory(poker.manager, 'session-1', 'student-1', false),
    ).resolves.toMatchObject({ pokerRoundId: 'round-1', originalScore: null, tipo: 'PARES' });

    const peerForm = managerFor({
      [FIND_SESSION_EVALUATION_RELEASES]: [{ selfEvalReleased: false, peerEvalReleased: false }],
      [FIND_SELF_ASSESSMENT_SCORE]: [],
      [FIND_POKER_ROUND_SCORE]: [],
      [FIND_PEER_FORM_SCORES]: [
        { id: 'peer-1', status: EvaluationStatus.DRAFT, sessionScore: null },
      ],
      [FIND_PEER_FORM_ADJUSTMENTS]: [],
    });
    await expect(
      resolveAndReadHistory(peerForm.manager, 'session-1', 'student-1', false),
    ).resolves.toMatchObject({
      sessionId: 'session-1',
      tipo: 'PARES',
      status: EvaluationStatus.DRAFT,
    });
  });

  it('defaults to self-assessment modality when no history or released evaluation exists', async () => {
    const { manager } = managerFor({
      [FIND_SESSION_EVALUATION_RELEASES]: [],
      [FIND_SELF_ASSESSMENT_SCORE]: [],
    });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', false),
    ).resolves.toBeNull();
  });

  it('resolves a released peer evaluation to a decided poker round', async () => {
    const { manager } = managerFor({
      [FIND_SESSION_EVALUATION_RELEASES]: [{ selfEvalReleased: false, peerEvalReleased: true }],
      [FIND_POKER_ROUND_SCORE]: [{ id: 'round-1', status: 'DECIDED', sessionScore: '8.2' }],
      [FIND_POKER_ADJUSTMENTS]: [adjustment],
    });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', false),
    ).resolves.toMatchObject({
      pokerRoundId: 'round-1',
      originalScore: 8.2,
      tipo: 'PARES',
      adjustments: [{ previousValue: 7.25, newValue: 8.5 }],
    });
  });

  it('returns a draft poker history without querying adjustments', async () => {
    const { manager, query } = managerFor({
      [FIND_POKER_ROUND_SCORE]: [{ id: 'round-1', status: 'OPEN', sessionScore: null }],
    });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', false, 'PARES'),
    ).resolves.toEqual({
      status: EvaluationStatus.DRAFT,
      originalScore: null,
      adjustments: [],
      tipo: 'PARES',
    });
    expect(query).not.toHaveBeenCalledWith(FIND_POKER_ADJUSTMENTS, expect.anything());
  });

  it('uses the peer form when no poker round exists and returns null if no history exists', async () => {
    const { manager } = managerFor({
      [FIND_POKER_ROUND_SCORE]: [],
      [FIND_PEER_FORM_SCORES]: [],
      [FIND_PEER_FORM_ADJUSTMENTS]: [],
    });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', false, 'PARES'),
    ).resolves.toBeNull();
  });

  it('returns a draft peer form when only unsubmitted evaluations exist', async () => {
    const { manager } = managerFor({
      [FIND_POKER_ROUND_SCORE]: [],
      [FIND_PEER_FORM_SCORES]: [
        { id: 'evaluation-1', status: EvaluationStatus.DRAFT, sessionScore: null },
      ],
      [FIND_PEER_FORM_ADJUSTMENTS]: [],
    });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', false, 'PARES'),
    ).resolves.toMatchObject({
      sessionId: 'session-1',
      studentId: 'student-1',
      status: EvaluationStatus.DRAFT,
      originalScore: null,
      tipo: 'PARES',
    });
  });

  it('averages submitted peer scores and applies lock queries when requested', async () => {
    const { manager, query } = managerFor({
      [LOCK_POKER_ROUND_SCORE]: [],
      [LOCK_PEER_FORM_SCORES]: [
        { id: 'evaluation-1', status: EvaluationStatus.SUBMITTED, sessionScore: '6' },
        { id: 'evaluation-2', status: EvaluationStatus.SUBMITTED, sessionScore: '8' },
        { id: 'evaluation-3', status: EvaluationStatus.DRAFT, sessionScore: '10' },
      ],
      [FIND_PEER_FORM_ADJUSTMENTS]: [],
    });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', true, 'PARES'),
    ).resolves.toMatchObject({
      originalScore: 7,
      status: EvaluationStatus.SUBMITTED,
    });
    expect(query).toHaveBeenCalledWith(LOCK_POKER_ROUND_SCORE, ['session-1', 'student-1']);
    expect(query).toHaveBeenCalledWith(LOCK_PEER_FORM_SCORES, ['session-1', 'student-1']);
    expect(query).toHaveBeenCalledWith(FIND_PEER_FORM_ADJUSTMENTS, ['session-1', 'student-1']);
  });

  it('prefers the latest adjustment original score over the submitted-score average', async () => {
    const { manager } = managerFor({
      [FIND_POKER_ROUND_SCORE]: [],
      [FIND_PEER_FORM_SCORES]: [
        { id: 'evaluation-1', status: EvaluationStatus.SUBMITTED, sessionScore: '6' },
      ],
      [FIND_PEER_FORM_ADJUSTMENTS]: [adjustment],
    });

    await expect(
      resolveAndReadHistory(manager, 'session-1', 'student-1', false, 'PARES'),
    ).resolves.toMatchObject({
      originalScore: 7.25,
      adjustments: [{ previousValue: 7.25, newValue: 8.5 }],
    });
  });
});

describe('toAdjustment', () => {
  it('converts persisted numeric values to numbers and preserves the remaining fields', () => {
    expect(toAdjustment(adjustment)).toEqual({ ...adjustment, previousValue: 7.25, newValue: 8.5 });
  });
});
