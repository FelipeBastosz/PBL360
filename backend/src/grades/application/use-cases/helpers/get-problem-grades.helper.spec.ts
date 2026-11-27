import {
  filterByStudentAndSession,
  processStudentSession,
  processStudentSessionForGrade,
  resolveSessionModality,
} from './get-problem-grades.helper';
import { collectSessionGrades } from './session-report-grade.helper';

describe('grades helpers edge cases', () => {
  it('filters rows by studentId and sessionId', () => {
    const rows = [
      { session_id: 's-1', student_id: 'st-1', value: 1 },
      { session_id: 's-1', student_id: 'st-2', value: 2 },
    ];

    expect(filterByStudentAndSession(rows, 's-1', 'st-2')).toEqual({
      session_id: 's-1',
      student_id: 'st-2',
      value: 2,
    });
    expect(filterByStudentAndSession(rows, 's-2', 'st-1')).toBeUndefined();
  });

  it('falls back to TUTOR modality when no evaluation modality is active', () => {
    expect(
      resolveSessionModality(false, { self_eval_released: false, peer_eval_released: false }),
    ).toEqual({
      modality: 'TUTOR',
      modalityScore: null,
    });
  });

  it('exports the session processing helpers for direct use', () => {
    const ctx = {
      session: { id: 's-1' },
      student: { id: 'st-1' },
      criteria: [],
      scores: [],
      attendances: [],
      roles: [],
      sessionComponents: [
        { type: 'CRITERIOS', weight: 70 },
        { type: 'PAPEL', weight: 30 },
      ],
      formulaVersion: 1,
      defaultSessionFormula: true,
    };
    const expected = {
      row: {
        session_id: 's-1',
        student_id: 'st-1',
        grade: null,
        situation: 'PENDENTE',
        formula_version: 1,
      },
      responseSession: {
        sessaoId: 's-1',
        nota: null,
        situacao: 'PENDENTE',
        modalidade: 'TUTOR',
      },
    };
    expect(processStudentSession(ctx as never)).toEqual(expected);

    const gradeContext = {
      student: { id: 'st-1' },
      criteria: [],
      scores: [],
      attendances: [],
      roles: [],
      sessionFormulas: [],
    };
    expect(processStudentSessionForGrade(gradeContext as never, { id: 's-1' })).toEqual(expected);
  });

  it('skips students without a matching session in collectSessionGrades', () => {
    const grades = collectSessionGrades(
      {
        response: {
          problemaId: 'p-1',
          formulaVersao: 1,
          alunos: [
            {
              alunoId: 'st-1',
              nome: 'Ana',
              matricula: '1',
              notaFinal: null,
              sessoes: [],
            },
          ],
        } as never,
        sessionGrades: [],
      },
      's-1',
    );

    expect(grades.size).toBe(0);
  });
});
