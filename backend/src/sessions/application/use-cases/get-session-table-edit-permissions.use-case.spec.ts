import { ForbiddenError } from '@/shared/errors/application.error';
import type { SessionTableEditingRepository } from '../../domain/repositories/session-table-editing.repository';
import { tableEditContext } from '../../testing/session-table-editing.fixture';
import { GetSessionTableEditPermissionsUseCase } from './get-session-table-edit-permissions.use-case';

describe('GetSessionTableEditPermissionsUseCase', () => {
  it.each([true, false])(
    'reports every session and explains the restriction when occurred=%s',
    async (occurred) => {
      const context = tableEditContext(occurred);
      const repository: SessionTableEditingRepository = {
        getContext: jest.fn().mockResolvedValue(context),
        edit: jest.fn(),
      };
      const result = await new GetSessionTableEditPermissionsUseCase(repository).execute(
        'session',
        'tutor',
      );
      expect(result.canEditCriteria).toBe(!occurred);
      expect(result.reason).toEqual(occurred ? expect.any(String) : null);
      expect(result.sessions).toEqual(context.sessions);
      expect(repository.edit).not.toHaveBeenCalled();
    },
  );

  it('does not expose sessions in unauthorized rooms', async () => {
    const context = tableEditContext();
    context.sessions[1]!.canAccess = false;
    const repository: SessionTableEditingRepository = {
      getContext: jest.fn().mockResolvedValue(context),
      edit: jest.fn(),
    };
    await expect(
      new GetSessionTableEditPermissionsUseCase(repository).execute('session', 'tutor'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('explains that a system default must be copied even before the session happens', async () => {
    const context = tableEditContext(false);
    context.table.isDefault = true;
    context.table.tutorId = null;
    context.sessions = [context.session];
    const repository: SessionTableEditingRepository = {
      getContext: jest.fn().mockResolvedValue(context),
      edit: jest.fn(),
    };
    const result = await new GetSessionTableEditPermissionsUseCase(repository).execute(
      'session',
      'tutor',
    );
    expect(result.canEditCriteria).toBe(false);
    expect(result.reason).toContain('somente leitura');
    expect(result.sessions).toEqual([context.session]);
  });
});
