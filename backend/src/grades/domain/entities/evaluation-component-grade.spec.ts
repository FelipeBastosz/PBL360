import { calculateProblemGrade } from './grade-calculator';
import {
  calculatePeerAssessmentSession,
  calculateProblemEvaluationComponent,
  calculateSelfAssessmentSession,
  type EvaluationRelease,
} from './evaluation-component-grade';

const now = new Date('2026-10-12T12:00:00.000Z');
const future = new Date('2026-10-20T12:00:00.000Z');
const past = new Date('2026-10-01T12:00:00.000Z');
const open: EvaluationRelease = { released: true, deadline: future };
const closed: EvaluationRelease = { released: true, deadline: past };
const switchedOff: EvaluationRelease = { released: false, deadline: future };
const neverReleased: EvaluationRelease = { released: false, deadline: null };

const self = (overrides: Partial<Parameters<typeof calculateSelfAssessmentSession>[0]>) =>
  calculateSelfAssessmentSession({
    attendance: 'PRESENT',
    release: closed,
    score: null,
    now,
    ...overrides,
  });

const peer = (overrides: Partial<Parameters<typeof calculatePeerAssessmentSession>[0]>) =>
  calculatePeerAssessmentSession({
    attendance: 'PRESENT',
    release: closed,
    receivedScores: [],
    now,
    ...overrides,
  });

describe('self-assessment session component', () => {
  it('uses the submitted (or tutor-adjusted) score: 8.25', () => {
    expect(self({ score: 8.25 })).toEqual({ grade: 8.25, situation: 'AVALIADA' });
  });

  it('keeps a submitted score even while the window is still open', () => {
    expect(self({ score: 6, release: open })).toEqual({ grade: 6, situation: 'AVALIADA' });
  });

  it('has no data while the window is open and nothing was sent', () => {
    expect(self({ release: open })).toEqual({ grade: null, situation: 'PENDENTE' });
    expect(self({ release: { released: true, deadline: null } })).toEqual({
      grade: null,
      situation: 'PENDENTE',
    });
  });

  it('counts 0 when nothing was sent after the deadline', () => {
    expect(self({ release: closed })).toEqual({ grade: 0, situation: 'NAO_ENVIADA' });
  });

  it('counts 0 when the release was switched off without a submission', () => {
    expect(self({ release: switchedOff })).toEqual({ grade: 0, situation: 'NAO_ENVIADA' });
  });

  it('leaves out a session that was never released', () => {
    expect(self({ release: neverReleased })).toEqual({ grade: null, situation: 'NAO_LIBERADA' });
  });

  it('leaves out absent and excused students, even with a score', () => {
    expect(self({ attendance: 'ABSENT', score: 9 })).toEqual({
      grade: null,
      situation: 'AUSENTE',
    });
    expect(self({ attendance: 'EXCUSED' })).toEqual({ grade: null, situation: 'JUSTIFICADA' });
  });

  it('does not penalize a student without a recorded roll call', () => {
    expect(self({ attendance: null })).toEqual({ grade: null, situation: 'PENDENTE' });
  });
});

describe('peer-assessment session component', () => {
  it('averages the received scores: (8 + 6 + 7) / 3 = 7', () => {
    expect(peer({ receivedScores: [8, 6, 7] })).toEqual({ grade: 7, situation: 'AVALIADA' });
  });

  it('keeps decimal precision: (7.5 + 8.25 + 9) / 3 = 8.25', () => {
    expect(peer({ receivedScores: [7.5, 8.25, 9] })).toEqual({
      grade: 8.25,
      situation: 'AVALIADA',
    });
  });

  it('has no data while the window is open, even with partial scores', () => {
    expect(peer({ release: open, receivedScores: [10] })).toEqual({
      grade: null,
      situation: 'PENDENTE',
    });
  });

  it('has no data when no classmate evaluated the student', () => {
    expect(peer({ receivedScores: [] })).toEqual({ grade: null, situation: 'SEM_AVALIACOES' });
    expect(peer({ release: switchedOff })).toEqual({ grade: null, situation: 'SEM_AVALIACOES' });
  });

  it('leaves out a session that was never released', () => {
    expect(peer({ release: neverReleased })).toEqual({ grade: null, situation: 'NAO_LIBERADA' });
  });

  it('leaves out absent and excused students', () => {
    expect(peer({ attendance: 'ABSENT', receivedScores: [9] })).toEqual({
      grade: null,
      situation: 'AUSENTE',
    });
    expect(peer({ attendance: 'EXCUSED', receivedScores: [9] })).toEqual({
      grade: null,
      situation: 'JUSTIFICADA',
    });
  });
});

describe('problem evaluation component', () => {
  it('averages only sessions with data, counting zeros: (9 + 0) / 2 = 4.5', () => {
    expect(
      calculateProblemEvaluationComponent([
        { grade: 9, situation: 'AVALIADA' },
        { grade: 0, situation: 'NAO_ENVIADA' },
        { grade: null, situation: 'PENDENTE' },
        { grade: null, situation: 'AUSENTE' },
      ]),
    ).toEqual({ grade: 4.5, situation: 'AVALIADA' });
  });

  it('has no data when no session has data', () => {
    expect(
      calculateProblemEvaluationComponent([
        { grade: null, situation: 'NAO_LIBERADA' },
        { grade: null, situation: 'JUSTIFICADA' },
      ]),
    ).toEqual({ grade: null, situation: 'PENDENTE' });
    expect(calculateProblemEvaluationComponent([])).toEqual({
      grade: null,
      situation: 'PENDENTE',
    });
  });
});

describe('self and peer assessments do not alter the problem grade', () => {
  it('uses only the session average even when self and peer assessments exist', () => {
    const selfGrade = calculateProblemEvaluationComponent([
      self({ score: 9 }),
      self({ release: closed }),
    ]).grade;
    const peerGrade = calculateProblemEvaluationComponent([
      peer({ receivedScores: [8, 6] }),
      peer({ receivedScores: [10] }),
    ]).grade;

    const result = calculateProblemGrade(
      [{ type: 'MEDIA_SESSOES', weight: 100 }],
      [
        { sessionId: 's1', grade: 8 },
        { sessionId: 's2', grade: 6 },
      ],
    );

    expect(selfGrade).toBe(4.5);
    expect(peerGrade).toBe(8.5);
    expect(result.grade).toBe(7);
  });
});
