import { Inject, Injectable } from '@nestjs/common';

import {
  RoomAccessService,
  type RoomMember,
} from '@/rooms/application/services/room-access.service';

import type { Problem } from '../../domain/entities/problem.entity';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '../../domain/repositories/problem.repository';

export interface ListProblemsByRoomInput {
  roomId: string;
  member: RoomMember;
}

@Injectable()
export class ListProblemsByRoomUseCase {
  constructor(
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: ListProblemsByRoomInput): Promise<Problem[]> {
    await this.roomAccessService.assertMemberCanAccessRoom(input.roomId, input.member);

    return this.problemRepository.findByRoomId(input.roomId);
  }
}
