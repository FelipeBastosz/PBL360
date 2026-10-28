import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  GRADES_REPOSITORY,
  type GradesRepository,
} from '../../domain/repositories/grades.repository';
import type { GradesResponseDto } from '../dtos/grades-response.dto';
import { calculateProblemGrades } from '../services/problem-grade-calculation';

@Injectable()
export class GetProblemGradesUseCase {
  constructor(
    @Inject(GRADES_REPOSITORY) private readonly gradesRepository: GradesRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(
    input: { roomId: string; problemId: string; tutorId: string },
    now = new Date(),
  ): Promise<GradesResponseDto> {
    await this.roomAccess.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    const problem = await this.gradesRepository.findProblem(input.problemId, input.roomId);
    if (!problem) throw new NotFoundError('Problema não encontrado na sala informada.');

    const data = await this.gradesRepository.findProblemData(input.roomId, input.problemId);
    const ids = data.formulas.map((formula) => formula.id).filter(Boolean);
    const components = await this.gradesRepository.findFormulaComponents(ids);
    const { response, sessionRows, problemRows } = calculateProblemGrades(data, components, now);
    await this.gradesRepository.saveGrades(input.problemId, { sessionRows, problemRows });
    return response;
  }
}
