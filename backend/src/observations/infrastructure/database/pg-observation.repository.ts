import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observation } from '../../domain/entities/observation.entity';
import type {
  ObservationRepository,
  RegistrationContext,
} from '../../domain/repositories/observation.repository';
import {
  CREATE_OBSERVATION_QUERY,
  FIND_OBSERVATION_BY_ID_QUERY,
  FIND_STUDENT_SESSION_OBSERVATIONS_QUERY,
  REGISTRATION_CONTEXT_QUERY,
} from './observation.queries';

type ObservationRow = Pick<
  Observation,
  'id' | 'sessionId' | 'studentId' | 'authorId' | 'text' | 'createdAt' | 'tags'
>;

const toObservation = (row: ObservationRow): Observation => Object.assign(new Observation(), row);

@Injectable()
export class PgObservationRepository implements ObservationRepository {
  constructor(
    @InjectRepository(Observation)
    private readonly observations: Repository<Observation>,
  ) {}

  async findRegistrationContext(
    roomId: string,
    studentId: string,
    tutorId: string,
    tagIds: string[],
  ): Promise<RegistrationContext> {
    const [context] = await this.observations.query<RegistrationContext[]>(
      REGISTRATION_CONTEXT_QUERY,
      [roomId, studentId, tutorId, tagIds],
    );
    return context ?? { studentEnrolled: false, usableTags: [] };
  }

  async create(observation: Observation): Promise<Observation> {
    const [created] = await this.observations.query<{ id: string; createdAt: Date }[]>(
      CREATE_OBSERVATION_QUERY,
      [
        observation.sessionId,
        observation.studentId,
        observation.authorId,
        observation.text,
        observation.tags.map((tag) => tag.id),
      ],
    );
    return Object.assign(observation, created);
  }

  async findById(id: string): Promise<Observation | null> {
    const rows = await this.observations.query<ObservationRow[]>(FIND_OBSERVATION_BY_ID_QUERY, [
      id,
    ]);
    return rows[0] ? toObservation(rows[0]) : null;
  }

  async updateText(observation: Observation): Promise<void> {
    await this.observations.update(observation.id, { text: observation.text });
  }

  async delete(id: string): Promise<void> {
    await this.observations.delete(id);
  }

  async findForStudentInSession(sessionId: string, studentId: string): Promise<Observation[]> {
    const rows = await this.observations.query<ObservationRow[]>(
      FIND_STUDENT_SESSION_OBSERVATIONS_QUERY,
      [sessionId, studentId],
    );
    return rows.map(toObservation);
  }
}
