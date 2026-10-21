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

  // eslint-disable-next-line max-lines-per-function
  async customize(
    roomId: string,
    problemId: string,
    tutorId: string,
    weights: Array<{ sessaoId: string; peso: number }>,
  ): Promise<FinalGradeFormulaOutput> {
    await this.assertAccess(roomId, problemId, tutorId);
    const sessions = await this.problems.listSessions(problemId);
    if (
      weights.length !== sessions.length ||
      new Set(weights.map((w) => w.sessaoId)).size !== weights.length ||
      sessions.some((s) => !weights.some((w) => w.sessaoId === s.id))
    ) {
      throw new UnprocessableEntityError(
        'Informe todas as sessões do problema exatamente uma vez.',
      );
    }
    if (weights.some((w) => !Number.isFinite(w.peso) || w.peso <= 0 || w.peso > 10)) {
      throw new UnprocessableEntityError(
        'O peso de cada sessão deve ser maior que zero e no máximo 10.',
      );
    }
    const old = await this.formulas.findActiveByProblemAndScope(problemId, FormulaScope.PROBLEMA);
    const formula = Formula.create({
      problemId,
      scope: FormulaScope.PROBLEMA,
      version: (old?.version ?? 0) + 1,
      active: true,
      createdBy: tutorId,
      components: weights.map(({ sessaoId, peso }) => ({
        type: 'SESSAO',
        referenceId: sessaoId,
        weight: peso,
      })),
    });
    try {
      await this.formulas.saveNewVersion(old, formula);
    } catch (error) {
      throw new UnprocessableEntityError(error instanceof Error ? error.message : String(error));
    }
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
    if (active) await this.formulas.deactivate(active);
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
    const weights = new Map(
      (formula?.components ?? [])
        .filter((c) => c.type === 'SESSAO')
        .map((c) => [c.referenceId, Number(c.weight)]),
    );
    return {
      padrao: !formula || formula.components.every((c) => c.type !== 'SESSAO'),
      versao: formula?.version ?? null,
      sessoes: sessions.map((s) => ({
        sessaoId: s.id,
        rotulo: s.title,
        peso: weights.get(s.id) ?? 1,
      })),
    };
  }
}
