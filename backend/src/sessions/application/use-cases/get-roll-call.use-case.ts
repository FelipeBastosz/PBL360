import { Inject, Injectable } from '@nestjs/common';
import {
  ATTENDANCE_REPOSITORY,
  type AttendanceRepository,
} from '../../domain/repositories/attendance.repository';
import { buildRollCall } from '../../domain/roll-call/build-roll-call';
import type { RollCall } from '../../domain/roll-call/roll-call';
import { SessionAccessService } from '../services/session-access.service';

@Injectable()
export class GetRollCallUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(ATTENDANCE_REPOSITORY) private readonly attendances: AttendanceRepository,
  ) {}

  async execute(sessionId: string, tutorId: string): Promise<RollCall> {
    const { session, roomId } = await this.access.assertTutorCanAccessSessionById(
      sessionId,
      tutorId,
    );
    const [enrolled, recorded] = await Promise.all([
      this.attendances.findEnrolledStudents(roomId),
      this.attendances.findBySession(sessionId),
    ]);
    const previous = recorded.length
      ? null
      : await this.attendances.findPreviousRollCall(roomId, { id: session.id, date: session.date });

    return buildRollCall({ sessionId, enrolled, recorded, previous });
  }
}
