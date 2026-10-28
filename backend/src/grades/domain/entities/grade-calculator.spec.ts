import {
  calculateProblemGrade,
  calculateSessionGrade,
  presentGrade,
  type GradeComponent,
} from './grade-calculator';

const criteria: GradeComponent[] = [
  { type: 'CRITERIO', referenceId: 'a', weight: 70 },
  { type: 'CRITERIO', referenceId: 'b', weight: 30 },
];

describe('grade calculator', () => {
  it('applies the default 70/30 formula with a cargo grade on a ten-point scale', () => {
    const result = calculateSessionGrade({
      attendance: 'PRESENT',
      criteria: [
        { id: 'a', score: 8 },
        { id: 'b', score: 6 },
        { id: 'c', score: 10 },
      ],
      components: [
        { type: 'CRITERIO', referenceId: 'a', weight: 40 },
        { type: 'CRITERIO', referenceId: 'b', weight: 40 },
        { type: 'CRITERIO', referenceId: 'c', weight: 20 },
      ],
      bonus: 5,
      defaultFormula: true,
    });

    expect(result.grade).toBeCloseTo(6.82, 10);
    expect(result.situation).toBe('AVALIADA');
  });

  it('uses the simple grade when no cargo score is assigned', () => {
    expect(
      calculateSessionGrade({
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 8 },
          { id: 'b', score: 6 },
        ],
        components: [
          { type: 'CRITERIO', referenceId: 'a', weight: 50 },
          { type: 'CRITERIO', referenceId: 'b', weight: 50 },
        ],
        bonus: null,
        defaultFormula: true,
      }),
    ).toEqual({ grade: 7, situation: 'AVALIADA' });
  });

  it('applies the configured criteria and role blocks to a session grade', () => {
    expect(
      calculateSessionGrade({
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 8, weight: 75 },
          { id: 'b', score: 4, weight: 25 },
        ],
        components: [
          { type: 'CRITERIOS', weight: 60 },
          { type: 'PAPEL', weight: 40 },
        ],
        bonus: 5,
      }),
    ).toEqual({ grade: 6.2, situation: 'AVALIADA' });
  });

  it.each([
    [
      'present weighted average',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 8 },
          { id: 'b', score: 6 },
        ],
        bonus: null,
      },
      7.4,
      'AVALIADA',
    ],
    [
      'late is evaluated',
      {
        attendance: 'LATE',
        criteria: [
          { id: 'a', score: 8 },
          { id: 'b', score: 6 },
        ],
        bonus: null,
      },
      7.4,
      'AVALIADA',
    ],
    ['absent is zero', { attendance: 'ABSENT', criteria: [], bonus: null }, 0, 'AUSENTE'],
    ['excused is null', { attendance: 'EXCUSED', criteria: [], bonus: null }, null, 'JUSTIFICADA'],
    [
      'missing attendance is pending',
      {
        attendance: null,
        criteria: [
          { id: 'a', score: 8 },
          { id: 'b', score: 6 },
        ],
        bonus: null,
      },
      7.4,
      'AVALIADA',
    ],
    [
      'missing score is pending',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 8 },
          { id: 'b', score: null },
        ],
        bonus: null,
      },
      8,
      'AVALIADA',
    ],
    [
      'all scores missing is pending',
      { attendance: 'PRESENT', criteria: [{ id: 'a', score: null }], bonus: null },
      null,
      'PENDENTE',
    ],
    [
      'redistributes missing weight',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: null },
          { id: 'b', score: 6 },
        ],
        bonus: null,
      },
      6,
      'AVALIADA',
    ],
    [
      'role score is weighted',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 8 },
          { id: 'b', score: 8 },
        ],
        bonus: 6,
      },
      7.4,
      'AVALIADA',
    ],
    [
      'role score at ten',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 10 },
          { id: 'b', score: 10 },
        ],
        bonus: 10,
      },
      10,
      'AVALIADA',
    ],
    [
      'both criteria keep their configured weights',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 2 },
          { id: 'b', score: 10 },
        ],
        bonus: null,
      },
      4.4,
      'AVALIADA',
    ],
    [
      'zero score remains evaluated',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 0 },
          { id: 'b', score: 0 },
        ],
        bonus: null,
      },
      0,
      'AVALIADA',
    ],
    [
      'role score can be zero',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 5 },
          { id: 'b', score: 5 },
        ],
        bonus: 0,
      },
      3.5,
      'AVALIADA',
    ],
    [
      'one criterion formula',
      { attendance: 'PRESENT', criteria: [{ id: 'a', score: 9 }], bonus: null },
      9,
      'AVALIADA',
    ],
    [
      'unreferenced criterion is ignored',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'x', score: 3 },
          { id: 'a', score: 9 },
          { id: 'b', score: 3 },
        ],
        bonus: null,
      },
      7.2,
      'AVALIADA',
    ],
  ])('%s', (_name, input, grade, situation) => {
    expect(
      calculateSessionGrade({
        ...input,
        components: criteria,
      } as Parameters<typeof calculateSessionGrade>[0]),
    ).toEqual({ grade, situation });
  });

  it('calculates the final grade and redistributes unavailable components', () => {
    expect(
      calculateProblemGrade(
        [{ type: 'MEDIA_SESSOES', weight: 100 }],
        [
          { sessionId: 's1', grade: 8 },
          { sessionId: 's2', grade: null },
        ],
      ),
    ).toEqual({ grade: 8 });
  });

  describe('active evaluation modalities', () => {
    it('calculates session grade from self-assessment modality score', () => {
      expect(
        calculateSessionGrade({
          attendance: 'PRESENT',
          criteria: [],
          components: criteria,
          bonus: null,
          modality: 'AUTOAVALIACAO',
          modalityScore: 8.5,
        }),
      ).toEqual({ grade: 8.5, situation: 'AVALIADA' });
    });

    it('calculates session grade from self-assessment with bonus applied', () => {
      const result = calculateSessionGrade({
        attendance: 'PRESENT',
        criteria: [],
        components: criteria,
        bonus: 10,
        defaultFormula: true,
        modality: 'AUTOAVALIACAO',
        modalityScore: 8,
      });
      expect(result.grade).toBeCloseTo(8.6, 5);
      expect(result.situation).toBe('AVALIADA');
    });

    it('calculates session grade from peer / poker modality score', () => {
      expect(
        calculateSessionGrade({
          attendance: 'PRESENT',
          criteria: [],
          components: criteria,
          bonus: null,
          modality: 'PARES',
          modalityScore: 9.2,
        }),
      ).toEqual({ grade: 9.2, situation: 'AVALIADA' });
    });

    it('returns pending situation when student modality score is missing', () => {
      expect(
        calculateSessionGrade({
          attendance: 'PRESENT',
          criteria: [],
          components: criteria,
          bonus: null,
          modality: 'AUTOAVALIACAO',
          modalityScore: null,
        }),
      ).toEqual({ grade: null, situation: 'PENDENTE' });
    });

    it('still applies attendance rules even when modality score is available', () => {
      expect(
        calculateSessionGrade({
          attendance: 'ABSENT',
          criteria: [],
          components: criteria,
          bonus: null,
          modality: 'AUTOAVALIACAO',
          modalityScore: 9,
        }),
      ).toEqual({ grade: 0, situation: 'AUSENTE' });
      expect(
        calculateSessionGrade({
          attendance: 'EXCUSED',
          criteria: [],
          components: criteria,
          bonus: null,
          modality: 'PARES',
          modalityScore: 9,
        }),
      ).toEqual({ grade: null, situation: 'JUSTIFICADA' });
    });
  });

  it('keeps internal precision and rounds only presentation', () => {
    expect(
      calculateProblemGrade(
        [{ type: 'MEDIA_SESSOES', weight: 100 }],
        [
          { sessionId: 's1', grade: 8 },
          { sessionId: 's2', grade: 7 },
        ],
      ),
    ).toEqual({ grade: 7.5 });
    expect(presentGrade(7.55)).toBe(7.6);
    expect(presentGrade(null)).toBeNull();
  });

  it('calculates the final grade using relative weights per session and skips missing grades', () => {
    expect(
      calculateProblemGrade(
        [
          { type: 'MEDIA_SESSOES', weight: 100 },
          { type: 'SESSAO', referenceId: 's1', weight: 3 },
          { type: 'SESSAO', referenceId: 's2', weight: 1 },
          { type: 'SESSAO', referenceId: 's3', weight: 10 },
        ],
        [
          { sessionId: 's1', grade: 8 },
          { sessionId: 's2', grade: 4 },
          { sessionId: 's3', grade: null },
        ],
      ),
    ).toEqual({ grade: 7 });
  });

  it('uses weight 1 for a newly created session and ignores justified sessions', () => {
    expect(
      calculateProblemGrade(
        [
          { type: 'MEDIA_SESSOES', weight: 100 },
          { type: 'SESSAO', referenceId: 's1', weight: 3 },
          { type: 'SESSAO', referenceId: 's2', weight: 1 },
        ],
        [
          { sessionId: 's1', grade: 8 },
          { sessionId: 's2', grade: null },
          { sessionId: 's3', grade: 4 },
        ],
      ),
    ).toEqual({ grade: 7 });
  });

  it('calculates the problem grade only from weighted session grades', () => {
    expect(
      calculateProblemGrade(
        [
          { type: 'MEDIA_SESSOES', weight: 100 },
          { type: 'SESSAO', referenceId: 's1', weight: 3 },
          { type: 'SESSAO', referenceId: 's2', weight: 1 },
        ],
        [
          { sessionId: 's1', grade: 8 },
          { sessionId: 's2', grade: 4 },
        ],
      ),
    ).toEqual({ grade: 7 });
  });
});
