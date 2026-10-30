import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SessionAccessService } from '../services/session-access.service';
import type { SessionFormulaDto } from '../dtos/session-evaluation-configuration.dto';
import { readSessionFormula } from '../../infrastructure/database/session-formula-configuration.persistence';
import { toSessionFormula } from '../services/session-evaluation-configuration.service';

@Injectable()
export class GetSessionFormulaUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly access: SessionAccessService,
  ) {}

  async execute(sessionId: string, tutorId: string): Promise<SessionFormulaDto> {
    await this.access.assertTutorCanAccessSession(sessionId, tutorId);
    return toSessionFormula(await readSessionFormula(this.dataSource.manager, sessionId));
  }
}
