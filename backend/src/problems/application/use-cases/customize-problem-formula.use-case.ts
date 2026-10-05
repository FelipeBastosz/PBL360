import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { FORMULA_REPOSITORY, type FormulaRepository } from '../../domain/repositories/formula.repository';
import { PROBLEM_REPOSITORY, type ProblemRepository } from '../../domain/repositories/problem.repository';
import { PERFORMANCE_TABLE_REPOSITORY, type PerformanceTableRepository } from '@/performance-tables/domain/repositories/performance-table.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { CustomizeFormulaDto } from '../dtos/customize-formula.dto';
import { GetProblemFormulaUseCase } from './get-problem-formula.use-case';
import { FormulaResponseDto } from '../dtos/formula-response.dto';
import { InvalidProblemError } from '../../errors/invalid-problem.error';

interface Input {
  roomId: string;
  problemId: string;
  tutorId: string;
  dto: CustomizeFormulaDto;
}

@Injectable()
export class CustomizeProblemFormulaUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(FORMULA_REPOSITORY) private readonly formulas: FormulaRepository,
    @Inject(PERFORMANCE_TABLE_REPOSITORY) private readonly tables: PerformanceTableRepository,
    private readonly roomAccessService: RoomAccessService,
    private readonly getFormulaUseCase: GetProblemFormulaUseCase,
  ) {}

  async execute(input: Input): Promise<FormulaResponseDto> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const problem = await this.problems.findById(input.problemId);
    if (!problem || problem.roomId !== input.roomId) {
      throw new NotFoundError('Problema não encontrado na sala informada.');
    }

    if (input.dto.escopo === FormulaScope.SESSAO) {
      if (!problem.performanceTableId) {
        throw new UnprocessableEntityError('O problema não possui uma tabela de desempenho vinculada.');
      }
      const table = await this.tables.findByIdIncludingDeleted(problem.performanceTableId);
      const validCriteriaIds = new Set(table?.criteria.map((c) => c.id) || []);
      
      for (const comp of input.dto.componentes) {
        if (!validCriteriaIds.has(comp.referenciaId!)) {
          throw new UnprocessableEntityError('Um ou mais critérios não pertencem à tabela de desempenho deste problema.');
        }
      }
    }

    const oldFormula = await this.formulas.findActiveByProblemAndScope(input.problemId, input.dto.escopo);
    
    try {
      const candidate = Formula.create({
        problemId: input.problemId,
        scope: input.dto.escopo,
        version: oldFormula ? oldFormula.version + 1 : 1,
        active: true,
        createdBy: input.tutorId,
        components: input.dto.componentes.map(c => ({
          type: c.tipo,
          referenceId: c.referenciaId,
          weight: c.peso,
        })),
      });

      await this.formulas.saveNewVersion(oldFormula, candidate);
    } catch (error) {
      if (error instanceof InvalidProblemError) {
        throw new UnprocessableEntityError(error.message);
      }
      throw error;
    }

    return this.getFormulaUseCase.execute({
      roomId: input.roomId,
      problemId: input.problemId,
      tutorId: input.tutorId,
      scope: input.dto.escopo,
    });
  }
}
