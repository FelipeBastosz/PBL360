import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import {
  FORMULA_REPOSITORY,
  type FormulaRepository,
} from '../../domain/repositories/formula.repository';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';

export interface FinalGradeFormulaOutput {
  padrao: boolean;
  versao: number | null;
  sessoes: Array<{ sessaoId: string; rotulo: string; peso: number }>;
}

@Injectable()
export class FinalGradeFormulaUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(FORMULA_REPOSITORY) private readonly formulas: FormulaRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async get(roomId: string, problemId: string, tutorId: string): Promise<FinalGradeFormulaOutput> {
    await this.assertAccess(roomId, problemId, tutorId);
    return this.read(problemId);
  }

  async customize(
    roomId: string,
    problemId: string,
    tutorId: string,
    weights: Array<{ sessaoId: string; peso: number }>,
  ): Promise<FinalGradeFormulaOutput> {
    await this.assertAccess(roomId, problemId, tutorId);
    const sessions = await this.problems.listSessions(problemId);
    validateSessionWeights(sessions, weights);
    const old = await this.formulas.findActiveByProblemAndScope(problemId, FormulaScope.PROBLEMA);
    const formula = createFormulaVersion(problemId, tutorId, weights, old);
    await this.formulas.saveNewVersion(old, formula);
    return this.read(problemId);
  }

  async restore(
    roomId: string,
    problemId: string,
    tutorId: string,
  ): Promise<FinalGradeFormulaOutput> {
    await this.assertAccess(roomId, problemId, tutorId);
    const active = await this.formulas.findActiveByProblemAndScope(
      problemId,
      FormulaScope.PROBLEMA,
    );
    await restoreSessionWeights(active, this.formulas);
    return this.read(problemId);
  }

  private async assertAccess(roomId: string, problemId: string, tutorId: string): Promise<void> {
    await this.roomAccess.assertTutorCanAccessRoom(roomId, tutorId);
    const problem = await this.problems.findById(problemId);
    if (!problem || problem.roomId !== roomId)
      throw new NotFoundError('Problema não encontrado na sala informada.');
  }

  private async read(problemId: string): Promise<FinalGradeFormulaOutput> {
    const [sessions, formula] = await Promise.all([
      this.problems.listSessions(problemId),
      this.formulas.findActiveByProblemAndScope(problemId, FormulaScope.PROBLEMA),
    ]);
    return toFinalGradeFormulaOutput(sessions, formula);
  }
}

function validateSessionWeights(
  sessions: Array<{ id: string }>,
  weights: Array<{ sessaoId: string; peso: number }>,
): void {
  const ids = weights.map((weight) => weight.sessaoId);
  if (
    sessions.length === 0 ||
    ids.length !== sessions.length ||
    new Set(ids).size !== ids.length ||
    sessions.some((session) => !ids.includes(session.id))
  ) {
    throw new UnprocessableEntityError('Informe todas as sessões do problema exatamente uma vez.');
  }
  if (weights.some(({ peso }) => !Number.isFinite(peso) || peso <= 0 || peso > 10)) {
    throw new UnprocessableEntityError(
      'O peso de cada sessão deve ser maior que zero e no máximo 10.',
    );
  }
}

function createFormulaVersion(
  problemId: string,
  tutorId: string,
  weights: Array<{ sessaoId: string; peso: number }>,
  old: Formula | null,
): Formula {
  return Formula.create({
    problemId,
    scope: FormulaScope.PROBLEMA,
    version: (old?.version ?? 0) + 1,
    active: true,
    createdBy: tutorId,
    components: [...baseProblemComponents(), ...sessionWeightComponents(weights)],
  });
}

function sessionWeightComponents(weights: Array<{ sessaoId: string; peso: number }>) {
  return weights.map(({ sessaoId, peso }) => ({
    type: 'SESSAO',
    referenceId: sessaoId,
    weight: peso,
  }));
}

function baseProblemComponents(): Array<{
  type: string;
  referenceId: string | null;
  weight: number;
}> {
  return [{ type: 'MEDIA_SESSOES', referenceId: null, weight: 100 }];
}

async function restoreSessionWeights(
  active: Formula | null,
  formulas: FormulaRepository,
): Promise<void> {
  if (active) await formulas.deactivate(active);
}

function toFinalGradeFormulaOutput(
  sessions: Array<{ id: string; title: string }>,
  formula: Formula | null,
): FinalGradeFormulaOutput {
  const sessionWeights =
    formula?.components.filter((component) => component.type === 'SESSAO') ?? [];
  const weights = new Map(
    sessionWeights.map((component) => [component.referenceId, Number(component.weight)]),
  );
  return {
    padrao: sessionWeights.length === 0,
    versao: sessionWeights.length === 0 ? null : (formula?.version ?? null),
    sessoes: sessions.map((session) => ({
      sessaoId: session.id,
      rotulo: session.title,
      peso: weights.get(session.id) ?? 1,
    })),
  };
}
