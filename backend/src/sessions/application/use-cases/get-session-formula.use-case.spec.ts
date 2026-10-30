import type { DataSource, EntityManager } from 'typeorm';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { SessionFormulaComponentType } from '../dtos/session-evaluation-configuration.dto';
import type { SessionAccessService } from '../services/session-access.service';
import { GetSessionFormulaUseCase } from './get-session-formula.use-case';

describe('GetSessionFormulaUseCase', () => {
  let useCase: GetSessionFormulaUseCase;
  let dataSource: DataSource;
  let access: SessionAccessService;
  let manager: EntityManager;
  let queryMock: jest.Mock;

  beforeEach(() => {
    queryMock = jest.fn();
    manager = { query: queryMock } as unknown as EntityManager;
    dataSource = { manager } as unknown as DataSource;
    access = {
      assertTutorCanAccessSession: jest.fn().mockResolvedValue({ id: 'session-1' }),
    } as unknown as SessionAccessService;
    useCase = new GetSessionFormulaUseCase(dataSource, access);
  });

  it('authorizes tutor via assertTutorCanAccessSession and returns formula components', async () => {
    queryMock.mockResolvedValue([
      { isDefault: true, version: 1, type: SessionFormulaComponentType.CRITERIOS, weight: 70 },
      { isDefault: true, version: 1, type: SessionFormulaComponentType.PAPEL, weight: 30 },
    ]);

    const result = await useCase.execute('session-1', 'co-tutor-1');

    expect(access.assertTutorCanAccessSession).toHaveBeenCalledWith('session-1', 'co-tutor-1');
    expect(result).toEqual({
      padrao: true,
      versao: null,
      componentes: [
        { tipo: SessionFormulaComponentType.CRITERIOS, peso: 70 },
        { tipo: SessionFormulaComponentType.PAPEL, peso: 30 },
      ],
    });
  });

  it('returns custom formula version and weights when configured', async () => {
    queryMock.mockResolvedValue([
      { isDefault: false, version: 2, type: SessionFormulaComponentType.CRITERIOS, weight: 60 },
      { isDefault: false, version: 2, type: SessionFormulaComponentType.PAPEL, weight: 40 },
    ]);

    const result = await useCase.execute('session-1', 'co-tutor-1');

    expect(result).toEqual({
      padrao: false,
      versao: 2,
      componentes: [
        { tipo: SessionFormulaComponentType.CRITERIOS, peso: 60 },
        { tipo: SessionFormulaComponentType.PAPEL, peso: 40 },
      ],
    });
  });

  it('rejects with ForbiddenError when access check fails', async () => {
    (access.assertTutorCanAccessSession as jest.Mock).mockRejectedValue(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(useCase.execute('session-1', 'unrelated-tutor')).rejects.toThrow(ForbiddenError);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rejects with NotFoundError when formula row is missing', async () => {
    queryMock.mockResolvedValue([]);

    await expect(useCase.execute('session-1', 'co-tutor-1')).rejects.toThrow(NotFoundError);
  });
});
