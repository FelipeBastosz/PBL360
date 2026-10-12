import { Inject, Injectable } from '@nestjs/common';
import {
  SESSION_TABLE_EDITING_REPOSITORY,
  type SessionTableEditingRepository,
} from '../../domain/repositories/session-table-editing.repository';
import {
  assertTableSessionsAccessible,
  canEditTableCriteria,
  WEIGHTS_ONLY_REASON,
} from '../../domain/services/session-table-editing-policy';

@Injectable()
export class GetSessionTableEditPermissionsUseCase {
  constructor(
    @Inject(SESSION_TABLE_EDITING_REPOSITORY)
    private readonly tables: SessionTableEditingRepository,
  ) {}

  async execute(sessionId: string, tutorId: string) {
    const context = await this.tables.getContext(sessionId, tutorId);
    assertTableSessionsAccessible(context.sessions);
    const canEditCriteria = canEditTableCriteria(context);
    return {
      canEditCriteria,
      reason: canEditCriteria ? null : WEIGHTS_ONLY_REASON,
      sessions: context.sessions,
    };
  }
}
