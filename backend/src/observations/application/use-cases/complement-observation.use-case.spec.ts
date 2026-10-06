import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { ObservationRepository } from '../../domain/repositories/observation.repository';
import { ComplementObservationUseCase } from './complement-observation.use-case';
import { anObservation, fakeObservationRepository } from '../../testing/observation-test-doubles';

describe('ComplementObservationUseCase', () => {
  let repository: jest.Mocked<ObservationRepository>;
  let useCase: ComplementObservationUseCase;

  beforeEach(() => {
    repository = fakeObservationRepository();
    useCase = new ComplementObservationUseCase(repository);
  });

  it('replaces the text of an observation by its author', async () => {
    repository.findById.mockResolvedValue(anObservation());

    const observation = await useCase.execute('observation-1', 'tutor-1', '  Usou o celular ');

    expect(observation.text).toBe('Usou o celular');
    expect(repository.updateText).toHaveBeenCalledWith(observation);
  });

  it('rejects another tutor', async () => {
    repository.findById.mockResolvedValue(anObservation());

    await expect(useCase.execute('observation-1', 'tutor-2', 'X')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.updateText).not.toHaveBeenCalled();
  });

  it('reports a missing observation', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('observation-1', 'tutor-1', 'X')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
