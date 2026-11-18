import { ForbiddenError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { SessionAccessService } from '../services/session-access.service';
import type { SessionGeneralEvaluationRepository } from '../../domain/repositories/session-general-evaluation.repository';
import { SaveSessionGeneralEvaluationUseCase } from './save-session-general-evaluation.use-case';

describe('SaveSessionGeneralEvaluationUseCase', () => {
  let access: jest.Mocked<Pick<SessionAccessService, 'assertMemberCanAccessSession'>>;
  let evaluations: jest.Mocked<Pick<SessionGeneralEvaluationRepository, 'save'>>;

  beforeEach(() => {
    access = { assertMemberCanAccessSession: jest.fn() };
    evaluations = { save: jest.fn() };
  });

  it('saves a tutor evaluation using that tutor as the owner of the record', async () => {
    const useCase = new SaveSessionGeneralEvaluationUseCase(
      access as SessionAccessService,
      evaluations as SessionGeneralEvaluationRepository,
    );
    await useCase.execute('session-id', '  Relato do professor.  ', 'tutor-id', UserType.TUTOR);

    expect(access.assertMemberCanAccessSession).toHaveBeenCalledWith('session-id', {
      id: 'tutor-id',
      type: UserType.TUTOR,
    });
    expect(evaluations.save).toHaveBeenCalledWith('session-id', 'Relato do professor.', 'tutor-id');
  });

  it('rejects student writes and does not persist them', async () => {
    const useCase = new SaveSessionGeneralEvaluationUseCase(
      access as SessionAccessService,
      evaluations as SessionGeneralEvaluationRepository,
    );

    await expect(
      useCase.execute('session-id', 'Relato do aluno.', 'student-id', UserType.STUDENT),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(evaluations.save).not.toHaveBeenCalled();
  });

  it('does not save when the tutor has no room access', async () => {
    access.assertMemberCanAccessSession.mockRejectedValue(new Error('Access denied'));
    const useCase = new SaveSessionGeneralEvaluationUseCase(
      access as SessionAccessService,
      evaluations as SessionGeneralEvaluationRepository,
    );

    await expect(
      useCase.execute('session-id', 'Relato.', 'outsider-id', UserType.TUTOR),
    ).rejects.toThrow('Access denied');
    expect(evaluations.save).not.toHaveBeenCalled();
  });
});
