import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import {
  SESSION_ROLE_REPOSITORY,
  type SessionRoleRepository,
} from '../../domain/repositories/session-role.repository';

@Injectable()
export class ListSessionRolesUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_ROLE_REPOSITORY) private readonly roles: SessionRoleRepository,
  ) {}

  async execute(sessionId: string, tutorId: string) {
    await this.access.assertTutorCanAccessSessionById(sessionId, tutorId);
    return this.roles.list(sessionId);
  }
}
