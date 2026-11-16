import { gradeTone, statusTone, toArgb } from './report-palette';
import { formatIssuedAt } from './report-issued-at';

describe('report palette', () => {
  it.each([
    ['Presente', '#067647'],
    ['Nota enviada', '#067647'],
    ['Completa', '#067647'],
    ['Parcial', '#B54708'],
    ['Rascunho', '#B54708'],
    ['Não registrada', '#475467'],
    ['Pendente', '#475467'],
    ['Ausente', '#B42318'],
  ])('gives the status "%s" its color', (status, color) => {
    expect(statusTone(status)?.foreground).toBe(color);
  });

  it('leaves free text without a status color', () => {
    expect(statusTone('Ana Souza')).toBeUndefined();
  });

  it.each([
    [10, '#067647'],
    [7, '#067647'],
    [6.9, '#B54708'],
    [5, '#B54708'],
    [4.9, '#B42318'],
    [0, '#B42318'],
  ])('colors the grade %d by its range', (grade, color) => {
    expect(gradeTone(grade)?.foreground).toBe(color);
  });

  it('does not color numbers outside the grade scale', () => {
    expect(gradeTone(11)).toBeUndefined();
    expect(gradeTone(-1)).toBeUndefined();
  });

  it('converts colors to the Excel format', () => {
    expect(toArgb('#000077')).toBe('FF000077');
  });
});

describe('formatIssuedAt', () => {
  it('formats the issue moment in the Brazilian time zone', () => {
    expect(formatIssuedAt(new Date('2026-11-13T02:05:00Z'))).toEqual({
      date: '12/11/2026',
      time: '23:05',
    });
  });
});
