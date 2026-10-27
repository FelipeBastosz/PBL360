import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { SessionAccessService } from './session-access.service';
import {
  SessionFormulaComponentType,
  type SessionEvaluationConfigurationDto,
  type SessionTableChangeResponse,
  type UpdateSessionFormulaComponentDto,
} from '../dtos/session-evaluation-configuration.dto';
import type { SessionCriterionRow } from '../../infrastructure/database/session-table-configuration.persistence';
import { updateSessionTable } from '../../infrastructure/database/session-table-configuration.persistence';
import {
  readSessionTable,
  readTableCriteria,
} from '../../infrastructure/database/session-configuration.read.persistence';
import {
  readSessionFormula,
  restoreSessionFormula,
  updateSessionFormula,
} from '../../infrastructure/database/session-formula-configuration.persistence';

@Injectable()
export class SessionEvaluationConfigurationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly access: SessionAccessService,
  ) {}

  async get(sessionId: string, tutorId: string): Promise<SessionEvaluationConfigurationDto> {
    await this.access.assertTutorCanAccessSessionById(sessionId, tutorId);
    const table = await readSessionTable(this.dataSource.manager, sessionId);
    const criteria = await readTableCriteria(this.dataSource.manager, table.id);
    const blocked = await isSessionBlocked(this.dataSource, sessionId);
    const formula = toSessionFormula(await readSessionFormula(this.dataSource.manager, sessionId));
    return configurationResponse(table, criteria, formula, blocked);
  }

  async setTable(
    sessionId: string,
    tutorId: string,
    tableId: string,
    applyToFollowing: boolean,
  ): Promise<SessionTableChangeResponse> {
    const { session, roomId } = await this.access.assertTutorCanAccessSessionById(
      sessionId,
      tutorId,
    );
    return updateSessionTable(this.dataSource, session, tableId, roomId, tutorId, applyToFollowing);
  }

  async setFormula(
    sessionId: string,
    tutorId: string,
    components: UpdateSessionFormulaComponentDto[],
    applyToFollowing: boolean,
  ) {
    const { session } = await this.access.assertTutorCanAccessSessionById(sessionId, tutorId);
    assertFormulaComponents(components);
    await updateSessionFormula(
      this.dataSource,
      session,
      tutorId,
      components.map((component) => ({ type: component.tipo, weight: component.peso })),
      applyToFollowing,
    );
    return toSessionFormula(await readSessionFormula(this.dataSource.manager, sessionId));
  }

  async restoreFormula(sessionId: string, tutorId: string) {
    const { session } = await this.access.assertTutorCanAccessSessionById(sessionId, tutorId);
    await restoreSessionFormula(this.dataSource, session, tutorId);
    return toSessionFormula(await readSessionFormula(this.dataSource.manager, sessionId));
  }
}

function assertFormulaComponents(components: UpdateSessionFormulaComponentDto[]): void {
  const types = components.map((component) => component.tipo);
  if (
    types.length !== 2 ||
    new Set(types).size !== 2 ||
    !types.includes(SessionFormulaComponentType.CRITERIOS) ||
    !types.includes(SessionFormulaComponentType.PAPEL)
  ) {
    throw new UnprocessableEntityError(
      'A fórmula deve conter exatamente um componente CRITERIOS e um PAPEL.',
    );
  }
  const total = components.reduce((sum, component) => sum + component.peso, 0);
  if (Math.abs(total - 100) > 0.001) {
    throw new UnprocessableEntityError('A soma dos pesos dos componentes deve ser 100.');
  }
}

async function isSessionBlocked(dataSource: DataSource, sessionId: string): Promise<boolean> {
  const [row] = await dataSource.query<Array<{ blocked: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM evaluations
        WHERE session_id = $1 AND type = 'TUTOR_SESSION' AND status = 'SUBMITTED'
     ) AS blocked;`,
    [sessionId],
  );
  return row?.blocked ?? false;
}

function configurationResponse(
  table: { id: string; name: string; isDefault: boolean },
  criteria: Pick<SessionCriterionRow, 'id' | 'name' | 'weight'>[],
  formula: SessionEvaluationConfigurationDto['formula'],
  blocked: boolean,
): SessionEvaluationConfigurationDto {
  return {
    tabela: {
      id: table.id,
      nome: table.name,
      padrao: table.isDefault,
      criterios: mapCriteria(criteria),
    },
    formula,
    bloqueada: blocked,
  };
}

function mapCriteria(criteria: Pick<SessionCriterionRow, 'id' | 'name' | 'weight'>[]) {
  return criteria.map((criterion) => ({
    id: criterion.id,
    nome: criterion.name,
    peso: Number(criterion.weight),
    notaMaxima: 10,
  }));
}

function toSessionFormula(
  rows: Array<{
    isDefault: boolean;
    version: number;
    type: SessionFormulaComponentType;
    weight: string | number;
  }>,
): SessionEvaluationConfigurationDto['formula'] {
  const first = rows[0];
  if (!first) throw new NotFoundError('A fórmula da sessão não foi encontrada.');
  return {
    padrao: first.isDefault,
    versao: first.isDefault ? null : first.version,
    componentes: rows.map((row) => ({ tipo: row.type, peso: Number(row.weight) })),
  };
}
