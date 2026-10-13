import type { GradeComponent } from '../../../domain/entities/grade-calculator';
import type { GradeRow } from '../../../domain/repositories/grades.repository';

export interface SessionFormulaEntry {
  sessionId: string;
  components: GradeComponent[];
  formulaVersion: number;
  defaultFormula: boolean;
}

export function buildDefaultSessionComponents(sessionId: string, formulaId: string): GradeRow[] {
  return [
    { formula_id: formulaId, type: 'CRITERIOS', weight: 70, session_id: sessionId },
    { formula_id: formulaId, type: 'PAPEL', weight: 30, session_id: sessionId },
  ];
}

export function sessionFormulaFor(
  formulas: SessionFormulaEntry[],
  sessionId: string,
): SessionFormulaEntry {
  return (
    formulas.find((entry) => entry.sessionId === sessionId) ?? {
      sessionId,
      components: [
        { type: 'CRITERIOS', weight: 70 },
        { type: 'PAPEL', weight: 30 },
      ],
      formulaVersion: 1,
      defaultFormula: true,
    }
  );
}
