import { Formula, FormulaScope } from '../entities/formula.entity';

export const FORMULA_REPOSITORY = Symbol('FORMULA_REPOSITORY');

export interface FormulaRepository {
  findActiveByProblemAndScope(problemId: string, scope: FormulaScope): Promise<Formula | null>;
  saveNewVersion(oldFormula: Formula | null, newFormula: Formula): Promise<Formula>;
  deactivate(formula: Formula): Promise<void>;
}
