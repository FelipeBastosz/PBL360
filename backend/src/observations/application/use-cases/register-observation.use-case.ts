import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UnprocessableEntityError } from '@/shared/errors/application.error';
import { Observation } from '../../domain/entities/observation.entity';
import {
  OBSERVATION_REPOSITORY,
  type ObservationRepository,
  type RegistrationContext,
} from '../../domain/repositories/observation.repository';

export interface RegisterObservationInput {
  sessionId: string;
  studentId: string;
  tutorId: string;
  text: string | null;
  tagIds: string[];
}

@Injectable()
export class RegisterObservationUseCase {
  constructor(
    @Inject(OBSERVATION_REPOSITORY)
    private readonly observations: ObservationRepository,
    private readonly sessionAccess: SessionAccessService,
  ) {}

  async execute(input: RegisterObservationInput): Promise<Observation> {
    const { sessionId, studentId, tutorId, tagIds } = input;
    const { roomId } = await this.sessionAccess.assertTutorCanAccessSessionById(sessionId, tutorId);
    const context = await this.observations.findRegistrationContext(
      roomId,
      studentId,
      tutorId,
      tagIds,
    );
    this.assertCanRegister(context, tagIds);

    const observation = Observation.register({
      ...input,
      authorId: tutorId,
      tags: context.usableTags,
    });
    return this.observations.create(observation);
  }

  private assertCanRegister(context: RegistrationContext, tagIds: string[]): void {
    if (!context.studentEnrolled) {
      throw new UnprocessableEntityError('O aluno não está matriculado nesta sala.');
    }
    if (context.usableTags.length !== tagIds.length) {
      throw new UnprocessableEntityError('Há marcação inativa ou de outro professor.');
    }
  }
}
