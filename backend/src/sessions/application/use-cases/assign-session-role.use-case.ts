import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import { SessionRole } from '../../domain/enums/session-role.enum';
import {
  SESSION_ROLE_REPOSITORY,
  type SessionRoleRepository,
} from '../../domain/repositories/session-role.repository';

export interface AssignSessionRoleInput {
  sessionId: string;
  tutorId: string;
  studentId: string;
  role: SessionRole | null;
  bonusScore: number | null;
  transfer: boolean;
}

export interface AssignSessionRoleOutput {
  studentId: string;
  role: SessionRole | null;
  bonusScore: number | null;
}

@Injectable()
export class AssignSessionRoleUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_ROLE_REPOSITORY) private readonly roles: SessionRoleRepository,
  ) {}

  async execute(input: AssignSessionRoleInput): Promise<AssignSessionRoleOutput> {
    const { roomId } = await this.access.assertTutorCanAccessSessionById(
      input.sessionId,
      input.tutorId,
    );
    return this.assignRole(input, roomId);
  }

  private assignRole(
    input: Omit<AssignSessionRoleInput, 'tutorId'>,
    roomId: string,
  ): Promise<AssignSessionRoleOutput> {
    return this.roles.assign(
      input.sessionId,
      roomId,
      input.studentId,
      input.role,
      input.bonusScore,
      input.transfer,
    );
  }
}
