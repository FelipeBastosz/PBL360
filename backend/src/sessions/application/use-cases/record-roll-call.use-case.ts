import { Inject, Injectable } from '@nestjs/common';
import {
  ATTENDANCE_REPOSITORY,
  type AttendanceRepository,
} from '../../domain/repositories/attendance.repository';
import { createAttendanceEntry } from '../../domain/roll-call/attendance-entry';
import { buildRollCall } from '../../domain/roll-call/build-roll-call';
import type { AttendanceEntry, RollCall } from '../../domain/roll-call/roll-call';
import { assertBatchFitsRoom } from '../services/roll-call-batch';
import { SessionAccessService } from '../services/session-access.service';

export interface RecordRollCallInput {
  sessionId: string;
  tutorId: string;
  entries: AttendanceEntry[];
}

@Injectable()
export class RecordRollCallUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(ATTENDANCE_REPOSITORY) private readonly attendances: AttendanceRepository,
  ) {}

  async execute(input: RecordRollCallInput): Promise<RollCall> {
    const { roomId } = await this.access.assertTutorCanAccessSessionById(
      input.sessionId,
      input.tutorId,
    );
    const entries = input.entries.map(createAttendanceEntry);
    const enrolled = await this.attendances.findEnrolledStudents(roomId);
    assertBatchFitsRoom(entries, enrolled);

    await this.attendances.saveBatch(input.sessionId, input.tutorId, entries);
    const recorded = await this.attendances.findBySession(input.sessionId);

    return buildRollCall({ sessionId: input.sessionId, enrolled, recorded, previous: null });
  }
}
