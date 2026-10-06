import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import {
  OBSERVATION_REPOSITORY,
  type ObservationRepository,
} from '../../domain/repositories/observation.repository';

@Injectable()
export class UndoObservationUseCase {
  constructor(
    @Inject(OBSERVATION_REPOSITORY)
    private readonly observations: ObservationRepository,
  ) {}

  async execute(id: string, tutorId: string): Promise<void> {
    const observation = await this.observations.findById(id);
    if (!observation) throw new NotFoundError('Observação não encontrada.');
    if (!observation.isAuthoredBy(tutorId)) {
      throw new ForbiddenError('Só quem registrou a observação pode desfazê-la.');
    }

    await this.observations.delete(id);
  }
}
