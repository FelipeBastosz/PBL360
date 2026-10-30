import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  GRADES_REPOSITORY,
  type GradesRepository,
} from '../../domain/repositories/grades.repository';
import type { GradesResponseDto } from '../dtos/grades-response.dto';
import { calculateProblemGrades } from '../services/problem-grade-calculation';
import type {
  ProblemGradesInput,
  ProblemGradesWithSessionGrades,
} from './helpers/get-problem-grades.helper';

@Injectable()
export class GetProblemGradesUseCase {
  constructor(
    @Inject(GRADES_REPOSITORY) private readonly gradesRepository: GradesRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(input: ProblemGradesInput, now = new Date()): Promise<GradesResponseDto> {
    return (await this.calculateAndSave(input, now)).response;
  }

  async executeWithSessionGrades(
    input: ProblemGradesInput,
    now = new Date(),
  ): Promise<ProblemGradesWithSessionGrades> {
    const result = await this.calculateAndSave(input, now);
    return { response: result.response, sessionGrades: result.sessionRows };
  }

  private async calculateAndSave(input: ProblemGradesInput, now: Date) {
    await this.roomAccess.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    const problem = await this.gradesRepository.findProblem(input.problemId, input.roomId);
    if (!problem) throw new NotFoundError('Problema não encontrado na sala informada.');

    const data = await this.gradesRepository.findProblemData(input.roomId, input.problemId);
    const ids = data.formulas.map((formula) => formula.id).filter(Boolean);
    const components = await this.gradesRepository.findFormulaComponents(ids);
    const result = calculateProblemGrades(data, components, now);
    await this.gradesRepository.saveGrades(input.problemId, {
      sessionRows: result.sessionRows,
      problemRows: result.problemRows,
    });
    return result;
  }
}
