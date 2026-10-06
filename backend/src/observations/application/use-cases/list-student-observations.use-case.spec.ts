import { ForbiddenError } from '@/shared/errors/application.error';
import type { ObservationRepository } from '../../domain/repositories/observation.repository';
import { ListStudentObservationsUseCase } from './list-student-observations.use-case';
import {
  anObservation,
  fakeObservationRepository,
  fakeSessionAccess,
} from '../../testing/observation-test-doubles';

describe('ListStudentObservationsUseCase', () => {
  let repository: jest.Mocked<ObservationRepository>;
  let sessionAccess: ReturnType<typeof fakeSessionAccess>;
  let useCase: ListStudentObservationsUseCase;

  beforeEach(() => {
    repository = fakeObservationRepository();
    sessionAccess = fakeSessionAccess();
    useCase = new ListStudentObservationsUseCase(repository, sessionAccess);
  });

  it('lists the observations and counts how many times each tag was used', async () => {
    const late = { id: 'tag-1', name: 'Atraso' };
    const phone = { id: 'tag-2', name: 'Celular' };
    const observations = [
      anObservation({ tags: [late, phone] }),
      anObservation({ tags: [late] }),
      anObservation({ tags: [], text: 'Só texto' }),
    ];
    repository.findForStudentInSession.mockResolvedValue(observations);

    const result = await useCase.execute({
      sessionId: 'session-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
    });

    expect(result.observations).toBe(observations);
    expect(result.tagCounts).toEqual({ 'tag-1': 2, 'tag-2': 1 });
    expect(repository.findForStudentInSession).toHaveBeenCalledWith('session-1', 'student-1');
  });

  it('stops when the tutor cannot access the session', async () => {
    sessionAccess.assertTutorCanAccessSessionById.mockRejectedValue(new ForbiddenError('x'));

    await expect(
      useCase.execute({ sessionId: 'session-1', studentId: 'student-1', tutorId: 'tutor-2' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.findForStudentInSession).not.toHaveBeenCalled();
  });
});
