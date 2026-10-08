import { Inject, Injectable } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { InvalidRequestError } from '@/shared/errors/application.error';

import type { EvaluationReleaseChange } from '../../domain/entities/evaluation-release';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';
import {
  findProblemInRoom,
  toEvaluationReleasesOutput,
  type EvaluationReleasesOutput,
} from './helpers/evaluation-releases.helper';

export interface UpdateEvaluationReleasesInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  self?: EvaluationReleaseChange;
  peer?: EvaluationReleaseChange;
}

@Injectable()
export class UpdateEvaluationReleasesUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly repository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: UpdateEvaluationReleasesInput): Promise<EvaluationReleasesOutput> {
    if (!input.self && !input.peer) {
      throw new InvalidRequestError('Informe a autoavaliação, os pares ou ambos.');
    }
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    const problem = await findProblemInRoom(this.repository, input.roomId, input.problemId);
    const now = new Date();
    if (input.self) problem.changeRelease('self', input.self, input.tutorId, now);
    if (input.peer) problem.changeRelease('peer', input.peer, input.tutorId, now);

    const saved = await this.repository.save(problem);
    const submissions = await this.repository.countReleaseSubmissions(saved.id, saved.roomId);

    return toEvaluationReleasesOutput(saved, submissions);
  }
}
