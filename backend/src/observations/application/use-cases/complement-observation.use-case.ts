import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { Observation } from '../../domain/entities/observation.entity';
import {
  OBSERVATION_REPOSITORY,
  type ObservationRepository,
} from '../../domain/repositories/observation.repository';

export interface ComplementObservationInput {
  id: string;
  tutorId: string;
  text: string;
}

@Injectable()
export class ComplementObservationUseCase {
  constructor(
    @Inject(OBSERVATION_REPOSITORY)
    private readonly observations: ObservationRepository,
  ) {}

  async execute({ id, tutorId, text }: ComplementObservationInput): Promise<Observation> {
    const observation = await this.observations.findById(id);
    if (!observation) throw new NotFoundError('Observação não encontrada.');
    if (!observation.isAuthoredBy(tutorId)) {
      throw new ForbiddenError('Só quem registrou a observação pode alterá-la.');
    }

    observation.complement(text);
    await this.observations.updateText(observation);
    return observation;
  }
}
