import { ForbiddenError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { SessionAccessService } from '../services/session-access.service';
import type { SessionGeneralEvaluationRepository } from '../../domain/repositories/session-general-evaluation.repository';
import { SaveSessionGeneralEvaluationUseCase } from './save-session-general-evaluation.use-case';

describe('SaveSessionGeneralEvaluationUseCase', () => {
  let access: jest.Mocked<Pick<SessionAccessService, 'assertMemberCanAccessSession'>>;
  let evaluations: jest.Mocked<
    Pick<SessionGeneralEvaluationRepository, 'save' | 'deleteBySessionAndTutor'>
  >;

  beforeEach(() => {
    access = { assertMemberCanAccessSession: jest.fn() };
    evaluations = { save: jest.fn(), deleteBySessionAndTutor: jest.fn() };
  });

  const createUseCase = () =>
    new SaveSessionGeneralEvaluationUseCase(
      access as unknown as SessionAccessService,
      evaluations as unknown as SessionGeneralEvaluationRepository,
    );

  it('saves a tutor evaluation using that tutor as the owner of the record', async () => {
    const useCase = createUseCase();
    await useCase.execute('session-id', '  Relato do professor.  ', 'tutor-id', UserType.TUTOR);

    expect(access.assertMemberCanAccessSession).toHaveBeenCalledWith('session-id', {
      id: 'tutor-id',
      type: UserType.TUTOR,
    });
    expect(evaluations.save).toHaveBeenCalledWith('session-id', 'Relato do professor.', 'tutor-id');
  });

  it.each(['', '   '])(
    'deletes tutor evaluation and returns null when text is "%s"',
    async (emptyText) => {
      const useCase = createUseCase();

      const result = await useCase.execute('session-id', emptyText, 'tutor-id', UserType.TUTOR);

      expect(result).toBeNull();
      expect(evaluations.deleteBySessionAndTutor).toHaveBeenCalledWith('session-id', 'tutor-id');
      expect(evaluations.save).not.toHaveBeenCalled();
    },
  );

  it('rejects student writes and does not persist them', async () => {
    const useCase = createUseCase();

    await expect(
      useCase.execute('session-id', 'Relato do aluno.', 'student-id', UserType.STUDENT),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      useCase.execute('session-id', '', 'student-id', UserType.STUDENT),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(evaluations.save).not.toHaveBeenCalled();
    expect(evaluations.deleteBySessionAndTutor).not.toHaveBeenCalled();
  });

  it('does not save when the tutor has no room access', async () => {
    access.assertMemberCanAccessSession.mockRejectedValue(new Error('Access denied'));
    const useCase = createUseCase();

    await expect(
      useCase.execute('session-id', 'Relato.', 'outsider-id', UserType.TUTOR),
    ).rejects.toThrow('Access denied');
    expect(evaluations.save).not.toHaveBeenCalled();
  });
});
