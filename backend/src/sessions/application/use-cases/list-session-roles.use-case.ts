import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import {
  SESSION_ROLE_REPOSITORY,
  type SessionRoleListItem,
  type SessionRoleRepository,
} from '../../domain/repositories/session-role.repository';

export interface ListSessionRolesInput {
  sessionId: string;
  tutorId: string;
}

@Injectable()
export class ListSessionRolesUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_ROLE_REPOSITORY) private readonly roles: SessionRoleRepository,
  ) {}

  async execute({ sessionId, tutorId }: ListSessionRolesInput): Promise<SessionRoleListItem[]> {
    await this.access.assertTutorCanAccessSessionById(sessionId, tutorId);
    return this.roles.list(sessionId);
  }
}
