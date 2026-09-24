import { Inject, Injectable } from '@nestjs/common';

import { RoomAccessService } from '@/rooms/application/services/room-access.service';

import type { Problem } from '../../domain/entities/problem.entity';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';

export interface ListProblemsByRoomInput {
  roomId: string;
  tutorId: string;
}

@Injectable()
export class ListProblemsByRoomUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: ListProblemsByRoomInput): Promise<Problem[]> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);

    return this.problemRepository.findByRoomId(input.roomId);
  }
}
