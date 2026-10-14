import { Inject, Injectable } from '@nestjs/common';
import {
  SESSION_TABLE_EDITING_REPOSITORY,
  type SessionTableEditingRepository,
  type SessionTableEditInput,
} from '../../domain/repositories/session-table-editing.repository';
import { prepareSessionTableEdit } from '../../domain/services/session-table-editing-policy';

@Injectable()
export class EditSessionTableUseCase {
  constructor(
    @Inject(SESSION_TABLE_EDITING_REPOSITORY)
    private readonly tables: SessionTableEditingRepository,
  ) {}

  execute(input: SessionTableEditInput) {
    return this.tables.edit(input, (context) => prepareSessionTableEdit(context, input));
  }
}
