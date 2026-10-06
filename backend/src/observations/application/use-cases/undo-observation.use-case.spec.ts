import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { ObservationRepository } from '../../domain/repositories/observation.repository';
import { anObservation, fakeObservationRepository } from '../../testing/observation-test-doubles';
import { UndoObservationUseCase } from './undo-observation.use-case';

describe('UndoObservationUseCase', () => {
  let repository: jest.Mocked<ObservationRepository>;
  let useCase: UndoObservationUseCase;

  beforeEach(() => {
    repository = fakeObservationRepository();
    useCase = new UndoObservationUseCase(repository);
  });

  it('deletes an observation registered by mistake', async () => {
    repository.findById.mockResolvedValue(anObservation());

    await useCase.execute('observation-1', 'tutor-1');

    expect(repository.delete).toHaveBeenCalledWith('observation-1');
  });

  it('rejects another tutor', async () => {
    repository.findById.mockResolvedValue(anObservation());

    await expect(useCase.execute('observation-1', 'tutor-2')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('reports a missing observation', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('observation-1', 'tutor-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
