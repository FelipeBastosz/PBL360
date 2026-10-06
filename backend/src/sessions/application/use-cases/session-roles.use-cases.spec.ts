import { ConflictError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { SessionRole } from '../../domain/enums/session-role.enum';
import type { SessionRoleRepository } from '../../domain/repositories/session-role.repository';
import type { SessionAccessService } from '../services/session-access.service';
import { AssignSessionRoleUseCase } from './assign-session-role.use-case';
import { ListSessionRolesUseCase } from './list-session-roles.use-case';

describe('Session role use cases', () => {
  let repository: jest.Mocked<SessionRoleRepository>;
  let access: jest.Mocked<SessionAccessService>;

  beforeEach(() => {
    repository = {
      list: jest.fn().mockResolvedValue([
        {
          studentId: 'student-1',
          name: 'Student',
          role: SessionRole.COORDINATOR,
          bonusScore: 0.5,
        },
      ]),
      assign: jest.fn().mockResolvedValue({
        studentId: 'student-1',
        role: SessionRole.COORDINATOR,
        bonusScore: 0.5,
      }),
    };
    access = {
      assertTutorCanAccessSessionById: jest
        .fn()
        .mockResolvedValue({ session: {}, roomId: 'room-1' }),
    } as unknown as jest.Mocked<SessionAccessService>;
  });

  it('lists roles only after validating tutor access', async () => {
    const useCase = new ListSessionRolesUseCase(access, repository);
    await expect(
      useCase.execute({ sessionId: 'session-1', tutorId: 'tutor-1' }),
    ).resolves.toHaveLength(1);
    expect(access.assertTutorCanAccessSessionById).toHaveBeenCalledWith('session-1', 'tutor-1');
    expect(repository.list).toHaveBeenCalledWith('session-1');
  });

  it('assigns a role with transfer and note', async () => {
    const useCase = new AssignSessionRoleUseCase(access, repository);
    await useCase.execute({
      sessionId: 'session-1',
      tutorId: 'tutor-1',
      studentId: 'student-1',
      role: SessionRole.COORDINATOR,
      bonusScore: 0.5,
      transfer: true,
    });
    expect(repository.assign).toHaveBeenCalledWith(
      'session-1',
      'room-1',
      'student-1',
      SessionRole.COORDINATOR,
      0.5,
      true,
    );
  });

  it('propagates occupied-role conflicts and unenrolled-student errors', async () => {
    repository.assign.mockRejectedValueOnce(new ConflictError('O papel já está ocupado.'));
    const useCase = new AssignSessionRoleUseCase(access, repository);
    await expect(
      useCase.execute({
        sessionId: 'session-1',
        tutorId: 'tutor-1',
        studentId: 'student-2',
        role: SessionRole.COORDINATOR,
        bonusScore: null,
        transfer: false,
      }),
    ).rejects.toThrow(ConflictError);

    repository.assign.mockRejectedValueOnce(
      new UnprocessableEntityError('O aluno não está matriculado na sala.'),
    );
    await expect(
      useCase.execute({
        sessionId: 'session-1',
        tutorId: 'tutor-1',
        studentId: 'student-2',
        role: null,
        bonusScore: null,
        transfer: false,
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });
});
