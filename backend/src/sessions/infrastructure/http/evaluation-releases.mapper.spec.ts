import {
  toEvaluationReleaseChange,
  toEvaluationReleasesResponse,
} from './evaluation-releases.mapper';

describe('evaluation releases mapper', () => {
  it('translates the output to the Portuguese contract', () => {
    const deadline = new Date('2026-12-01T12:00:00Z');
    const updatedAt = new Date('2026-10-01T12:00:00Z');

    expect(
      toEvaluationReleasesResponse({
        self: { released: true, deadline, submitted: 2, expected: 3 },
        peer: { released: false, deadline: null, submitted: 0, expected: 6 },
        updatedAt,
        updatedBy: 'tutor-1',
      }),
    ).toEqual({
      autoavaliacao: { liberada: true, prazo: deadline, enviadas: 2, esperadas: 3 },
      pares: { liberada: false, prazo: null, enviadas: 0, esperadas: 6 },
      atualizadoEm: updatedAt,
      atualizadoPor: 'tutor-1',
    });
  });

  it('converts the deadline string into a date', () => {
    expect(toEvaluationReleaseChange({ liberada: true, prazo: '2026-12-01T12:00:00Z' })).toEqual({
      released: true,
      deadline: new Date('2026-12-01T12:00:00Z'),
    });
  });

  it('treats a missing deadline as no deadline', () => {
    expect(toEvaluationReleaseChange({ liberada: false })).toEqual({
      released: false,
      deadline: null,
    });
  });

  it('ignores a release that was not sent', () => {
    expect(toEvaluationReleaseChange(undefined)).toBeUndefined();
  });
});
