import type { DataSource } from 'typeorm';
import { UnprocessableEntityError } from '@/shared/errors/application.error';
import type { SessionAccessService } from './session-access.service';
import { SessionEvaluationConfigurationService } from './session-evaluation-configuration.service';

describe('SessionEvaluationConfigurationService', () => {
  it('rejects a session formula whose weights do not sum to 100 before persistence', async () => {
    const dataSource = {
      transaction: jest.fn(),
    } as unknown as DataSource;
    const access = {
      assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({
        session: { id: 'session-1', problemId: 'problem-1', orderIndex: 1 },
        roomId: 'room-1',
      }),
    } as unknown as SessionAccessService;
    const service = new SessionEvaluationConfigurationService(dataSource, access);

    await expect(
      service.setFormula(
        'session-1',
        'tutor-1',
        [
          { tipo: 'CRITERIOS' as const, peso: 60 },
          { tipo: 'PAPEL' as const, peso: 30 },
        ],
        false,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects duplicate formula component types', async () => {
    const access = {
      assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({
        session: { id: 'session-1', problemId: 'problem-1', orderIndex: 1 },
        roomId: 'room-1',
      }),
    } as unknown as SessionAccessService;
    const service = new SessionEvaluationConfigurationService({} as DataSource, access);

    await expect(
      service.setFormula(
        'session-1',
        'tutor-1',
        [
          { tipo: 'CRITERIOS' as const, peso: 60 },
          { tipo: 'CRITERIOS' as const, peso: 40 },
        ],
        false,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });
});
