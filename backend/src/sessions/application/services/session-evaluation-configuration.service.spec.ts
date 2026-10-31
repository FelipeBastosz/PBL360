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

  it('delegates authorization to SessionAccessService.assertTutorCanAccessSession on getFormula', async () => {
    const queryMock = jest.fn().mockResolvedValue([
      { isDefault: true, version: 1, type: 'CRITERIOS', weight: 70 },
      { isDefault: true, version: 1, type: 'PAPEL', weight: 30 },
    ]);
    const dataSource = {
      manager: { query: queryMock },
    } as unknown as DataSource;
    const access = {
      assertTutorCanAccessSession: jest.fn().mockResolvedValue({ id: 'session-1' }),
    } as unknown as SessionAccessService;
    const service = new SessionEvaluationConfigurationService(dataSource, access);

    const result = await service.getFormula('session-1', 'co-tutor-1');

    expect(access.assertTutorCanAccessSession).toHaveBeenCalledWith('session-1', 'co-tutor-1');
    expect(result).toEqual({
      padrao: true,
      versao: null,
      componentes: [
        { tipo: 'CRITERIOS', peso: 70 },
        { tipo: 'PAPEL', peso: 30 },
      ],
    });
  });
});
