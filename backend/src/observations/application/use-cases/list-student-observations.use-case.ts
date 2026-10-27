import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import type { Observation } from '../../domain/entities/observation.entity';
import {
  OBSERVATION_REPOSITORY,
  type ObservationRepository,
} from '../../domain/repositories/observation.repository';

export interface ListStudentObservationsInput {
  sessionId: string;
  studentId: string;
  tutorId: string;
}

export interface StudentObservations {
  observations: Observation[];
  tagCounts: Record<string, number>;
}

@Injectable()
export class ListStudentObservationsUseCase {
  constructor(
    @Inject(OBSERVATION_REPOSITORY)
    private readonly observations: ObservationRepository,
    private readonly sessionAccess: SessionAccessService,
  ) {}

  async execute({
    sessionId,
    studentId,
    tutorId,
  }: ListStudentObservationsInput): Promise<StudentObservations> {
    await this.sessionAccess.assertTutorCanAccessSessionById(sessionId, tutorId);
    const observations = await this.observations.findForStudentInSession(sessionId, studentId);

    const tagCounts: Record<string, number> = {};
    for (const tag of observations.flatMap((observation) => observation.tags)) {
      tagCounts[tag.id] = (tagCounts[tag.id] ?? 0) + 1;
    }

    return { observations, tagCounts };
  }
}
