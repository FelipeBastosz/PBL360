import type { EntityManager } from 'typeorm';
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import {
  readSessionConfiguration,
  toEvaluationFormula,
} from '@/sessions/infrastructure/database/session-configuration.read.persistence';
import {
  freezeSessionConfig,
  assertSessionExists,
  readFormula,
  readProblemConfig,
  readSessionConfig,
  readSessionTableConfig,
} from './session-evaluation-config.persistence';

jest.mock('@/sessions/infrastructure/database/session-configuration.read.persistence', () => ({
  readSessionConfiguration: jest.fn(),
  toEvaluationFormula: jest.fn(),
}));

const criterion = {
  id: 'criterion-1',
  name: 'Critério',
  description: null,
  weight: 80,
  orderIndex: 1,
};

const configuration: SessionEvaluationConfig = {
  tableId: 'table-1',
  tableName: 'Tabela',
  criteria: [criterion],
  frozen: false,
  formula: { criteriaWeight: 80, roleWeight: 20 },
};

describe('session evaluation config persistence', () => {
  const readConfigurationMock = jest.mocked(readSessionConfiguration);
  const formulaMock = jest.mocked(toEvaluationFormula);

  beforeEach(() => {
    jest.clearAllMocks();
    readConfigurationMock.mockResolvedValue(configuration);
    formulaMock.mockReturnValue({ criteriaWeight: 80, roleWeight: 20 });
  });

  it('reads the first session configuration for a problem', async () => {
    const manager = {
      query: jest.fn().mockResolvedValue([{ id: 'session-1' }]),
    } as unknown as EntityManager;

    await expect(readProblemConfig(manager, 'problem-1')).resolves.toBe(configuration);
    expect(readConfigurationMock).toHaveBeenCalledWith(manager, 'session-1');
  });

  it('rejects a problem without sessions', async () => {
    const manager = { query: jest.fn().mockResolvedValue([]) } as unknown as EntityManager;
    await expect(readProblemConfig(manager, 'problem-1')).rejects.toBeInstanceOf(
      UnprocessableEntityError,
    );
  });

  it('reads a session table config by delegating to the session reader', async () => {
    const manager = {} as EntityManager;
    await expect(readSessionTableConfig(manager, 'session-1')).resolves.toBe(configuration);
    expect(readConfigurationMock).toHaveBeenCalledWith(manager, 'session-1');
  });

  it('returns null when the session has no frozen config', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await expect(
      readSessionConfig({ query } as unknown as EntityManager, 'session-1'),
    ).resolves.toBe(null);
  });

  it('reads frozen criteria and converts their weights to numbers', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ tableId: 'table-1', tableName: 'Tabela' }])
      .mockResolvedValueOnce([{ ...criterion, weight: '80' }])
      .mockResolvedValueOnce([
        { type: 'CRITERIOS', weight: '80' },
        { type: 'PAPEL', weight: '20' },
      ]);
    const manager = { query } as unknown as EntityManager;

    await expect(readSessionConfig(manager, 'session-1')).resolves.toEqual({
      tableId: 'table-1',
      tableName: 'Tabela',
      criteria: [criterion],
      frozen: true,
      formula: { criteriaWeight: 80, roleWeight: 20 },
    });
    expect(formulaMock).toHaveBeenCalledWith([
      { type: 'CRITERIOS', weight: '80' },
      { type: 'PAPEL', weight: '20' },
    ]);
  });

  it('maps formula rows through the shared formula converter', async () => {
    const rows = [
      { type: 'CRITERIOS', weight: 70 },
      { type: 'PAPEL', weight: 30 },
    ];
    const query = jest.fn().mockResolvedValue(rows);
    await expect(readFormula({ query } as unknown as EntityManager, 'session-1')).resolves.toEqual({
      criteriaWeight: 80,
      roleWeight: 20,
    });
    expect(formulaMock).toHaveBeenCalledWith(rows);
  });

  it('returns an existing frozen config without creating another snapshot', async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ tableId: 'table-1', tableName: 'Tabela' }])
        .mockResolvedValueOnce([{ ...criterion, weight: '80' }])
        .mockResolvedValueOnce([
          { type: 'CRITERIOS', weight: '80' },
          { type: 'PAPEL', weight: '20' },
        ]),
    } as unknown as EntityManager;

    await expect(freezeSessionConfig(manager, 'session-1', 'tutor-1')).resolves.toMatchObject({
      tableId: 'table-1',
      frozen: true,
    });
    expect(readConfigurationMock).not.toHaveBeenCalled();
  });

  it('creates a frozen snapshot and stores each criterion when none exists', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValue([]);
    const manager = { query } as unknown as EntityManager;

    await expect(freezeSessionConfig(manager, 'session-1', 'tutor-1')).resolves.toMatchObject({
      tableId: 'table-1',
      frozen: true,
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO session_evaluation_configs'),
      ['session-1', 'table-1', 'Tabela', 'tutor-1'],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO session_evaluation_criteria'),
      ['session-1', 'criterion-1', 'Critério', null, 80, 1],
    );
  });

  it('refuses to freeze a table without active criteria', async () => {
    readConfigurationMock.mockResolvedValue({ ...configuration, criteria: [] });
    const manager = {
      query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
    } as unknown as EntityManager;

    await expect(freezeSessionConfig(manager, 'session-1', 'tutor-1')).rejects.toBeInstanceOf(
      UnprocessableEntityError,
    );
  });

  it('checks that a session exists and is not locked for direct evaluation', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        { id: 'session-1', selfEvalReleased: false, peerEvalReleased: false, hasPoker: false },
      ]);
    await expect(
      assertSessionExists({ query } as unknown as EntityManager, 'session-1', 'problem-1'),
    ).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), [
      'session-1',
      'problem-1',
    ]);
  });

  it('rejects a session that does not belong to the problem', async () => {
    const query = jest.fn().mockResolvedValueOnce([]);
    await expect(
      assertSessionExists({ query } as unknown as EntityManager, 'missing', 'problem-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it.each([
    { selfEvalReleased: true, peerEvalReleased: false, hasPoker: false },
    { selfEvalReleased: false, peerEvalReleased: true, hasPoker: false },
    { selfEvalReleased: false, peerEvalReleased: false, hasPoker: true },
  ])('rejects direct evaluation while another evaluation flow is active: %o', async (flags) => {
    const query = jest.fn().mockResolvedValueOnce([{ id: 'session-1', ...flags }]);
    await expect(
      assertSessionExists({ query } as unknown as EntityManager, 'session-1', 'problem-1'),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
