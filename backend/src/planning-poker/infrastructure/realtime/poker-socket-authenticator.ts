import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors/application.error';
import { ACCESS_TOKEN_AUDIENCE, type AccessTokenClaims } from '@/shared/security/access-token';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { USER_REPOSITORY, type UserRepository } from '@/users/domain/repositories/user.repository';
import {
  PLANNING_POKER_REPOSITORY,
  type PlanningPokerRepository,
} from '../../domain/repositories/planning-poker.repository';
import type { PokerAudience } from './poker-event.mapper';

export interface PokerHandshake {
  token?: unknown;
  sessaoId?: unknown;
}

export interface PokerSocketIdentity {
  sessionId: string;
  audience: PokerAudience;
}

const INVALID_TOKEN = 'Token de autenticação inválido ou expirado.';

@Injectable()
export class PokerSocketAuthenticator {
  constructor(
    private readonly jwt: JwtService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PLANNING_POKER_REPOSITORY) private readonly pokers: PlanningPokerRepository,
    private readonly access: SessionAccessService,
  ) {}

  async authenticate(handshake: PokerHandshake): Promise<PokerSocketIdentity> {
    const { token, sessaoId } = handshake;
    if (typeof sessaoId !== 'string' || !isUUID(sessaoId)) {
      throw new ForbiddenError('Sessão inválida.');
    }
    const user = await this.currentUser(token);
    if (user.type === UserType.TUTOR) {
      await this.access.assertTutorCanAccessSessionById(sessaoId, user.id);
      return { sessionId: sessaoId, audience: 'TUTOR' };
    }
    await this.access.assertMemberCanAccessSession(sessaoId, user);
    await this.assertParticipant(sessaoId, user.id);
    return { sessionId: sessaoId, audience: 'STUDENT' };
  }

  private async currentUser(token: unknown): Promise<{ id: string; type: UserType }> {
    if (typeof token !== 'string') throw new UnauthorizedError(INVALID_TOKEN);
    const claims = await this.jwt
      .verifyAsync<AccessTokenClaims>(token, { audience: ACCESS_TOKEN_AUDIENCE })
      .catch(() => null);
    const user = claims ? await this.users.findById(claims.sub) : null;
    if (!user || !claims || user.isPendingVerification() || user.tokenVersion !== claims.ver) {
      throw new UnauthorizedError(INVALID_TOKEN);
    }
    return { id: user.id, type: user.type };
  }

  private async assertParticipant(sessionId: string, studentId: string): Promise<void> {
    const { participants } = await this.pokers.findRoster(sessionId);
    if (!participants.some((participant) => participant.studentId === studentId)) {
      throw new ForbiddenError('Você não participou desta sessão.');
    }
  }
}
