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
    expect(
      calculateSessionGrade({
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
        bonus: 0.5,
        defaultFormula: true,
      }),
    ).toEqual({ grade: 6.82, situation: 'AVALIADA' });
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
      'bonus is added',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 8 },
          { id: 'b', score: 6 },
        ],
        bonus: 0.5,
      },
      7.9,
      'AVALIADA',
    ],
    [
      'bonus respects ten ceiling',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 10 },
          { id: 'b', score: 10 },
        ],
        bonus: 1,
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
      'bonus can be zero',
      {
        attendance: 'PRESENT',
        criteria: [
          { id: 'a', score: 5 },
          { id: 'b', score: 5 },
        ],
        bonus: 0,
      },
      5,
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
        [
          { type: 'MEDIA_SESSOES', weight: 60 },
          { type: 'AUTOAVALIACAO', weight: 40, value: null },
        ],
        [8, null],
      ),
    ).toEqual({ grade: 8 });
  });

  it('keeps internal precision and rounds only presentation', () => {
    expect(calculateProblemGrade([{ type: 'MEDIA_SESSOES', weight: 100 }], [8, 7])).toEqual({
      grade: 7.5,
    });
    expect(presentGrade(7.55)).toBe(7.6);
    expect(presentGrade(null)).toBeNull();
  });
});
