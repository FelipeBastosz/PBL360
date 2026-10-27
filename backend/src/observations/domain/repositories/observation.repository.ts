import type { Observation, ObservationTagRef } from '../entities/observation.entity';

export const OBSERVATION_REPOSITORY = Symbol('OBSERVATION_REPOSITORY');

export interface RegistrationContext {
  studentEnrolled: boolean;
  usableTags: ObservationTagRef[];
}

export interface ObservationRepository {
  findRegistrationContext(
    roomId: string,
    studentId: string,
    tutorId: string,
    tagIds: string[],
  ): Promise<RegistrationContext>;
  create(observation: Observation): Promise<Observation>;
  findById(id: string): Promise<Observation | null>;
  updateText(observation: Observation): Promise<void>;
  delete(id: string): Promise<void>;
  findForStudentInSession(sessionId: string, studentId: string): Promise<Observation[]>;
}
