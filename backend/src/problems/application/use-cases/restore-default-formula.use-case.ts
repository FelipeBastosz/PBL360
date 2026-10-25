import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import {
  FORMULA_REPOSITORY,
  type FormulaRepository,
} from '../../domain/repositories/formula.repository';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  GetProblemFormulaUseCase,
  type ProblemFormulaOutput,
} from './get-problem-formula.use-case';

export interface RestoreDefaultFormulaInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  scope: FormulaScope;
}

@Injectable()
export class RestoreDefaultFormulaUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(FORMULA_REPOSITORY) private readonly formulas: FormulaRepository,
    private readonly roomAccessService: RoomAccessService,
    private readonly getFormulaUseCase: GetProblemFormulaUseCase,
  ) {}

  async execute(input: RestoreDefaultFormulaInput): Promise<ProblemFormulaOutput> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    if (input.scope !== FormulaScope.PROBLEMA) {
      throw new UnprocessableEntityError(
        'A fórmula da sessão deve ser restaurada pela configuração da própria sessão.',
      );
    }
    const problem = await this.problems.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }

    const active = await this.formulas.findActiveByProblemAndScope(input.problemId, input.scope);
    await restorePercentageFormula(active, input, this.formulas);

    return this.getFormulaUseCase.execute(input);
  }
}

async function restorePercentageFormula(
  active: Formula | null,
  input: RestoreDefaultFormulaInput,
  formulas: FormulaRepository,
): Promise<void> {
  if (!active) return;
  const sessionComponents = active.components.filter((component) => component.type === 'SESSAO');
  if (sessionComponents.length === 0) return formulas.deactivate(active);
  await formulas.saveNewVersion(active, createDefaultPercentageFormula(active, input));
}

function createDefaultPercentageFormula(
  active: Formula,
  input: RestoreDefaultFormulaInput,
): Formula {
  return Formula.create({
    problemId: input.problemId,
    scope: input.scope,
    version: active.version + 1,
    active: true,
    createdBy: input.tutorId,
    components: [...defaultProblemComponents, ...sessionComponentInputs(active)],
  });
}

function sessionComponentInputs(formula: Formula) {
  return formula.components
    .filter((component) => component.type === 'SESSAO')
    .map(({ type, referenceId, weight }) => ({ type, referenceId, weight: Number(weight) }));
}

const defaultProblemComponents: Array<{ type: string; referenceId: null; weight: number }> = [
  { type: 'MEDIA_SESSOES', referenceId: null, weight: 100 },
  { type: 'AUTOAVALIACAO', referenceId: null, weight: 0 },
  { type: 'PARES', referenceId: null, weight: 0 },
];
