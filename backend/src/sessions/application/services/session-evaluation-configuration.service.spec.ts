import type { DataSource } from 'typeorm';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import {
  SessionFormulaComponentType,
  type SessionEvaluationConfigurationDto,
  type UpdateSessionFormulaComponentDto,
} from '../dtos/session-evaluation-configuration.dto';
import type { SessionAccessService } from './session-access.service';
import {
  readSessionTable,
  readTableCriteria,
} from '../../infrastructure/database/session-configuration.read.persistence';
import {
  readSessionFormula,
  restoreSessionFormula,
  updateSessionFormula,
} from '../../infrastructure/database/session-formula-configuration.persistence';
import { updateSessionTable } from '../../infrastructure/database/session-table-configuration.persistence';
import {
  SessionEvaluationConfigurationService,
  toSessionFormula,
} from './session-evaluation-configuration.service';

jest.mock('../../infrastructure/database/session-table-configuration.persistence', () => ({
  updateSessionTable: jest.fn(),
}));
jest.mock('../../infrastructure/database/session-configuration.read.persistence', () => ({
  readSessionTable: jest.fn(),
  readTableCriteria: jest.fn(),
}));
jest.mock('../../infrastructure/database/session-formula-configuration.persistence', () => ({
  readSessionFormula: jest.fn(),
  restoreSessionFormula: jest.fn(),
  updateSessionFormula: jest.fn(),
}));

const formulaRows = [
  { isDefault: true, version: 1, type: SessionFormulaComponentType.CRITERIOS, weight: '70' },
  { isDefault: true, version: 1, type: SessionFormulaComponentType.PAPEL, weight: '30' },
];

const sessionContext = {
  session: { id: 'session-1', problemId: 'problem-1', orderIndex: 1, title: 'Sessão 1' },
  roomId: 'room-1',
};

const component = (
  tipo: SessionFormulaComponentType,
  peso: number,
): UpdateSessionFormulaComponentDto => ({ tipo, peso });

describe('SessionEvaluationConfigurationService', () => {
  const access = {
    assertTutorCanAccessSession: jest.fn(),
    assertTutorCanAccessSessionById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    access.assertTutorCanAccessSession.mockResolvedValue(sessionContext);
    access.assertTutorCanAccessSessionById.mockResolvedValue(sessionContext);
    jest
      .mocked(readSessionTable)
      .mockResolvedValue({ id: 'table-1', name: 'Tabela', isDefault: false });
    jest
      .mocked(readTableCriteria)
      .mockResolvedValue([
        { id: 'criterion-1', name: 'Critério', description: null, weight: '80', orderIndex: 1 },
      ]);
    jest.mocked(readSessionFormula).mockResolvedValue(formulaRows);
    jest
      .mocked(updateSessionTable)
      .mockResolvedValue({ sessoesAtualizadas: [], sessoesIgnoradas: [] });
    jest.mocked(updateSessionFormula).mockResolvedValue(undefined);
    jest.mocked(restoreSessionFormula).mockResolvedValue(undefined);
  });

  const createService = (blockedRows: Array<{ blocked: boolean }> = [{ blocked: false }]) => {
    const manager = { query: jest.fn() };
    const dataSource = {
      manager,
      query: jest.fn().mockResolvedValue(blockedRows),
      transaction: jest.fn(),
    } as unknown as DataSource;
    return {
      service: new SessionEvaluationConfigurationService(
        dataSource,
        access as unknown as SessionAccessService,
      ),
      dataSource,
      manager,
    };
  };

  it('reads the table, criteria, formula and blocked state for an authorized tutor', async () => {
    const { service, dataSource, manager } = createService([{ blocked: true }]);

    await expect(service.get('session-1', 'tutor-1')).resolves.toEqual({
      tabela: {
        id: 'table-1',
        nome: 'Tabela',
        padrao: false,
        criterios: [{ id: 'criterion-1', nome: 'Critério', peso: 80, notaMaxima: 10 }],
      },
      formula: {
        padrao: true,
        versao: null,
        componentes: [
          { tipo: 'CRITERIOS', peso: 70 },
          { tipo: 'PAPEL', peso: 30 },
        ],
      },
      bloqueada: true,
    } satisfies SessionEvaluationConfigurationDto);
    expect(access.assertTutorCanAccessSession).toHaveBeenCalledWith('session-1', 'tutor-1');
    expect(readSessionTable).toHaveBeenCalledWith(manager, 'session-1');
    expect(readTableCriteria).toHaveBeenCalledWith(manager, 'table-1');
    expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining("status = 'SUBMITTED'"), [
      'session-1',
    ]);
  });

  it('defaults an absent blocked-state row to false', async () => {
    const { service } = createService([]);
    await expect(service.get('session-1', 'tutor-1')).resolves.toMatchObject({ bloqueada: false });
  });

  it('maps an unblocked session when the query returns false', async () => {
    const { service } = createService([{ blocked: false }]);
    await expect(service.get('session-1', 'tutor-1')).resolves.toMatchObject({ bloqueada: false });
  });

  it('delegates table updates after resolving the tutor session and room', async () => {
    const { service, dataSource } = createService();
    const response = { sessoesAtualizadas: [], sessoesIgnoradas: [] };
    jest.mocked(updateSessionTable).mockResolvedValue(response);

    await expect(service.setTable('session-1', 'tutor-1', 'table-2', true)).resolves.toBe(response);
    expect(access.assertTutorCanAccessSessionById).toHaveBeenCalledWith('session-1', 'tutor-1');
    expect(updateSessionTable).toHaveBeenCalledWith(
      dataSource,
      sessionContext.session,
      'table-2',
      'room-1',
      'tutor-1',
      true,
    );
  });

  it('rejects an incomplete set of formula component types', async () => {
    const { service } = createService();
    await expect(
      service.setFormula(
        'session-1',
        'tutor-1',
        [component(SessionFormulaComponentType.CRITERIOS, 100)],
        false,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
    expect(updateSessionFormula).not.toHaveBeenCalled();
  });

  it('rejects duplicate formula component types', async () => {
    const { service } = createService();
    await expect(
      service.setFormula(
        'session-1',
        'tutor-1',
        [
          component(SessionFormulaComponentType.CRITERIOS, 60),
          component(SessionFormulaComponentType.CRITERIOS, 40),
        ],
        false,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it('rejects two distinct but unsupported formula component types', async () => {
    const { service } = createService();
    const invalid = [
      component(SessionFormulaComponentType.CRITERIOS, 50),
      { tipo: 'OUTRO', peso: 50 },
    ] as UpdateSessionFormulaComponentDto[];
    await expect(service.setFormula('session-1', 'tutor-1', invalid, false)).rejects.toBeInstanceOf(
      UnprocessableEntityError,
    );
  });

  it('rejects formula weights that do not sum to 100', async () => {
    const { service } = createService();
    await expect(
      service.setFormula(
        'session-1',
        'tutor-1',
        [
          component(SessionFormulaComponentType.CRITERIOS, 60),
          component(SessionFormulaComponentType.PAPEL, 30),
        ],
        false,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it('persists a valid formula, then returns the active formula', async () => {
    const { service, dataSource } = createService();
    jest.mocked(readSessionFormula).mockResolvedValue([
      { ...formulaRows[0], isDefault: false, version: 2 },
      { ...formulaRows[1], isDefault: false, version: 2 },
    ]);
    const components = [
      component(SessionFormulaComponentType.CRITERIOS, 65),
      component(SessionFormulaComponentType.PAPEL, 35),
    ];

    await expect(
      service.setFormula('session-1', 'tutor-1', components, true),
    ).resolves.toMatchObject({ padrao: false, versao: 2 });
    expect(updateSessionFormula).toHaveBeenCalledWith(
      dataSource,
      sessionContext.session,
      'tutor-1',
      [
        { type: SessionFormulaComponentType.CRITERIOS, weight: 65 },
        { type: SessionFormulaComponentType.PAPEL, weight: 35 },
      ],
      true,
    );
  });

  it('restores the default formula and returns its current version', async () => {
    const { service, dataSource } = createService();
    await expect(service.restoreFormula('session-1', 'tutor-1')).resolves.toMatchObject({
      padrao: true,
      versao: null,
    });
    expect(restoreSessionFormula).toHaveBeenCalledWith(
      dataSource,
      sessionContext.session,
      'tutor-1',
    );
  });

  it('reads the current session formula for an authorized tutor', async () => {
    const { service, manager } = createService();
    await expect(service.getFormula('session-1', 'tutor-1')).resolves.toEqual({
      padrao: true,
      versao: null,
      componentes: [
        { tipo: SessionFormulaComponentType.CRITERIOS, peso: 70 },
        { tipo: SessionFormulaComponentType.PAPEL, peso: 30 },
      ],
    });
    expect(access.assertTutorCanAccessSession).toHaveBeenCalledWith('session-1', 'tutor-1');
    expect(readSessionFormula).toHaveBeenCalledWith(manager, 'session-1');
  });
});

describe('toSessionFormula', () => {
  it('rejects an empty formula', () => {
    expect(() => toSessionFormula([])).toThrow(NotFoundError);
  });

  it('returns no version for the default formula', () => {
    expect(toSessionFormula(formulaRows)).toEqual({
      padrao: true,
      versao: null,
      componentes: [
        { tipo: SessionFormulaComponentType.CRITERIOS, peso: 70 },
        { tipo: SessionFormulaComponentType.PAPEL, peso: 30 },
      ],
    });
  });

  it('returns the version for a customized formula and converts numeric text', () => {
    expect(
      toSessionFormula([
        { ...formulaRows[0], isDefault: false, version: 3, weight: '55' },
        { ...formulaRows[1], isDefault: false, version: 3, weight: '45' },
      ]),
    ).toEqual({
      padrao: false,
      versao: 3,
      componentes: [
        { tipo: SessionFormulaComponentType.CRITERIOS, peso: 55 },
        { tipo: SessionFormulaComponentType.PAPEL, peso: 45 },
      ],
    });
  });
});
