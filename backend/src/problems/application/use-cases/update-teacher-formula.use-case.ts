import { Inject, Injectable } from '@nestjs/common';
import { UnprocessableEntityError } from '@/shared/errors/application.error';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { FormulaComponentType } from '../../domain/entities/formula-component.entity';
import { InvalidProblemError } from '../../domain/errors/invalid-problem.error';
import {
  FORMULA_REPOSITORY,
  type FormulaRepository,
} from '../../domain/repositories/formula.repository';
import type { TeacherFormulaOutput } from './get-teacher-formula.use-case';

export interface UpdateTeacherFormulaComponentInput {
  type: string;
  weight: number;
}

export interface UpdateTeacherFormulaInput {
  tutorId: string;
  components: UpdateTeacherFormulaComponentInput[];
}

@Injectable()
export class UpdateTeacherFormulaUseCase {
  constructor(@Inject(FORMULA_REPOSITORY) private readonly formulas: FormulaRepository) {}

  async execute(input: UpdateTeacherFormulaInput): Promise<TeacherFormulaOutput> {
    assertTeacherFormulaComponents(input.components);
    const oldFormula = await this.formulas.findActiveByTutor(input.tutorId);
    const candidate = this.buildCandidate(input, oldFormula);
    const saved = await this.persist(oldFormula, candidate);
    return this.toOutput(saved);
  }

  private buildCandidate(input: UpdateTeacherFormulaInput, oldFormula: Formula | null): Formula {
    try {
      return Formula.create({
        scope: FormulaScope.PROFESSOR,
        version: oldFormula ? oldFormula.version + 1 : 1,
        active: true,
        isDefault: true,
        createdBy: input.tutorId,
        components: input.components,
      });
    } catch (error) {
      if (error instanceof InvalidProblemError) {
        throw new UnprocessableEntityError(error.message);
      }
      throw error;
    }
  }

  private async persist(oldFormula: Formula | null, candidate: Formula): Promise<Formula> {
    return this.formulas.saveNewVersion(oldFormula, candidate);
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

function assertTeacherFormulaComponents(components: UpdateTeacherFormulaComponentInput[]): void {
  const types = components.map((c) => c.type);
  if (
    types.length !== 2 ||
    new Set(types).size !== 2 ||
    !types.includes(FormulaComponentType.CRITERIOS) ||
    !types.includes(FormulaComponentType.PAPEL)
  ) {
    throw new UnprocessableEntityError(
      'A fórmula do professor deve conter exatamente um componente CRITERIOS e um PAPEL.',
    );
  }
  const total = components.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new UnprocessableEntityError(
      'A soma dos pesos dos componentes deve ser exatamente 100%.',
    );
  }
}
