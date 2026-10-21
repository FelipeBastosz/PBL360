import { CloseSessionUseCase } from './close-session.use-case';

describe('CloseSessionUseCase', () => {
  const session = {
    id: 'session-1',
    status: 'concluida',
    closedAt: new Date('2026-10-21T12:00:00.000Z'),
    closedBy: 'tutor-1',
  } as never;
  const repository = { close: jest.fn().mockResolvedValue(session) };
  const access = { assertTutorCanAccessSessionById: jest.fn().mockResolvedValue(undefined) };
  const useCase = new CloseSessionUseCase(repository as never, access as never);

  beforeEach(() => jest.clearAllMocks());

  it('validates tutor access and records closure using the authenticated tutor', async () => {
    await expect(useCase.execute('session-1', 'tutor-1')).resolves.toBe(session);
    expect(access.assertTutorCanAccessSessionById).toHaveBeenCalledWith('session-1', 'tutor-1');
    expect(repository.close).toHaveBeenCalledWith('session-1', 'tutor-1', expect.any(Date));
  });

  it('does not save when tutor access is denied', async () => {
    access.assertTutorCanAccessSessionById.mockRejectedValueOnce(new Error('forbidden'));
    await expect(useCase.execute('session-1', 'tutor-1')).rejects.toThrow('forbidden');
    expect(repository.close).not.toHaveBeenCalled();
  });
});
