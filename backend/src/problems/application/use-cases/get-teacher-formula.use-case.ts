import { Inject, Injectable } from '@nestjs/common';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import {
  FORMULA_REPOSITORY,
  type FormulaRepository,
} from '../../domain/repositories/formula.repository';

export interface GetTeacherFormulaInput {
  tutorId: string;
}

export interface TeacherFormulaComponentOutput {
  type: string;
  weight: number;
}

export interface TeacherFormulaOutput {
  id?: string;
  scope: FormulaScope;
  isDefault: boolean;
  version: number | null;
  components: TeacherFormulaComponentOutput[];
}

export const DEFAULT_TEACHER_FORMULA_COMPONENTS: TeacherFormulaComponentOutput[] = [
  { type: 'CRITERIOS', weight: 70 },
  { type: 'PAPEL', weight: 30 },
];

@Injectable()
export class GetTeacherFormulaUseCase {
  constructor(@Inject(FORMULA_REPOSITORY) private readonly formulas: FormulaRepository) {}

  async execute(input: GetTeacherFormulaInput): Promise<TeacherFormulaOutput> {
    const formula = await this.formulas.findActiveByTutor(input.tutorId);
    return formula ? this.toOutput(formula) : this.defaultOutput();
  }

  private defaultOutput(): TeacherFormulaOutput {
    return {
      scope: FormulaScope.PROFESSOR,
      isDefault: true,
      version: null,
      components: DEFAULT_TEACHER_FORMULA_COMPONENTS,
    };
  }

  private toOutput(formula: Formula): TeacherFormulaOutput {
    return {
      id: formula.id,
      scope: formula.scope,
      isDefault: formula.isDefault,
      version: formula.version,
      components: formula.components.map((c) => ({
        type: c.type,
        weight: Number(c.weight),
      })),
    };
  }
}
