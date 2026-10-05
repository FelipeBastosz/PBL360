import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { InvalidObservationError } from '../../domain/errors/invalid-observation.error';
import type { ObservationRepository } from '../../domain/repositories/observation.repository';
import {
  fakeObservationRepository,
  fakeSessionAccess,
} from '../../testing/observation-test-doubles';
import {
  RegisterObservationUseCase,
  type RegisterObservationInput,
} from './register-observation.use-case';

describe('RegisterObservationUseCase', () => {
  let repository: jest.Mocked<ObservationRepository>;
  let sessionAccess: ReturnType<typeof fakeSessionAccess>;
  let useCase: RegisterObservationUseCase;

  const input = (overrides: Partial<RegisterObservationInput> = {}): RegisterObservationInput => ({
    sessionId: 'session-1',
    studentId: 'student-1',
    tutorId: 'tutor-1',
    text: null,
    tagIds: ['tag-1'],
    ...overrides,
  });

  beforeEach(() => {
    repository = fakeObservationRepository();
    sessionAccess = fakeSessionAccess('room-1');
    useCase = new RegisterObservationUseCase(repository, sessionAccess);
    repository.findRegistrationContext.mockResolvedValue({
      studentEnrolled: true,
      usableTags: [{ id: 'tag-1', name: 'Atraso' }],
    });
  });

  it('registers an observation with the tags of the tutor', async () => {
    const observation = await useCase.execute(input());

    expect(observation.authorId).toBe('tutor-1');
    expect(observation.tags).toEqual([{ id: 'tag-1', name: 'Atraso' }]);
    expect(repository.create).toHaveBeenCalledWith(observation);
  });

  it('looks up the context in the room of the session', async () => {
    await useCase.execute(input());

    expect(sessionAccess.assertTutorCanAccessSessionById).toHaveBeenCalledWith(
      'session-1',
      'tutor-1',
    );
    expect(repository.findRegistrationContext).toHaveBeenCalledWith(
      'room-1',
      'student-1',
      'tutor-1',
      ['tag-1'],
    );
  });

  it('registers an observation made only of text', async () => {
    repository.findRegistrationContext.mockResolvedValue({ studentEnrolled: true, usableTags: [] });

    const observation = await useCase.execute(input({ text: 'Chegou atrasado', tagIds: [] }));

    expect(observation.text).toBe('Chegou atrasado');
  });

  it('rejects a student who is not enrolled in the room', async () => {
    repository.findRegistrationContext.mockResolvedValue({
      studentEnrolled: false,
      usableTags: [{ id: 'tag-1', name: 'Atraso' }],
    });

    await expect(useCase.execute(input())).rejects.toBeInstanceOf(UnprocessableEntityError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a tag that is inactive or belongs to another tutor', async () => {
    repository.findRegistrationContext.mockResolvedValue({ studentEnrolled: true, usableTags: [] });

    await expect(useCase.execute(input())).rejects.toBeInstanceOf(UnprocessableEntityError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects an observation without text and without tags', async () => {
    repository.findRegistrationContext.mockResolvedValue({ studentEnrolled: true, usableTags: [] });

    await expect(useCase.execute(input({ tagIds: [] }))).rejects.toBeInstanceOf(
      InvalidObservationError,
    );
  });

  it('stops when the tutor cannot access the session', async () => {
    sessionAccess.assertTutorCanAccessSessionById.mockRejectedValue(new NotFoundError('x'));

    await expect(useCase.execute(input())).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.findRegistrationContext).not.toHaveBeenCalled();
  });
});
