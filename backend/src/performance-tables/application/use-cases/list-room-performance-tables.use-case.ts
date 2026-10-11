import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  PERFORMANCE_TABLE_REPOSITORY,
  type PerformanceTableRepository,
  type RoomPerformanceTableItem,
} from '../../domain/repositories/performance-table.repository';

export interface ListRoomPerformanceTablesInput {
  roomId: string;
  tutorId: string;
}

@Injectable()
export class ListRoomPerformanceTablesUseCase {
  constructor(
    @Inject(PERFORMANCE_TABLE_REPOSITORY)
    private readonly performanceTableRepository: PerformanceTableRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute({
    roomId,
    tutorId,
  }: ListRoomPerformanceTablesInput): Promise<RoomPerformanceTableItem[]> {
    await this.roomAccessService.assertTutorCanAccessRoom(roomId, tutorId);

    return this.performanceTableRepository.findTablesByRoom(roomId, tutorId);
  }
}
