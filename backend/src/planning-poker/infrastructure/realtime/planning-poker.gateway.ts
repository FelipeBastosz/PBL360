import { Logger } from '@nestjs/common';
import { type OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import type {
  PokerEvent,
  PokerEventPublisher,
} from '../../application/services/poker-event-publisher';
import { toSocketMessage, type PokerAudience } from './poker-event.mapper';
import { PokerSocketAuthenticator, type PokerHandshake } from './poker-socket-authenticator';

const AUDIENCES: PokerAudience[] = ['TUTOR', 'STUDENT'];

export const pokerRoom = (sessionId: string, audience: PokerAudience): string =>
  `poker:${sessionId}:${audience}`;

@WebSocketGateway({ namespace: 'poker' })
export class PlanningPokerGateway implements OnGatewayConnection, PokerEventPublisher {
  private readonly logger = new Logger(PlanningPokerGateway.name);

  @WebSocketServer() private server?: Namespace;

  constructor(private readonly authenticator: PokerSocketAuthenticator) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const handshake: PokerHandshake = client.handshake.auth;
      const identity = await this.authenticator.authenticate(handshake);
      await client.join(pokerRoom(identity.sessionId, identity.audience));
      client.emit('poker.conectado', {
        perfil: identity.audience === 'TUTOR' ? 'PROFESSOR' : 'ALUNO',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conexão recusada.';
      client.emit('poker.erro', { mensagem: message });
      client.disconnect(true);
    }
  }

  publish(sessionId: string, event: PokerEvent): void {
    if (!this.server) {
      this.logger.warn(`Planning poker event ${event.type} dropped: gateway not ready.`);
      return;
    }
    for (const audience of AUDIENCES) {
      const { name, payload } = toSocketMessage(event, audience);
      this.server.to(pokerRoom(sessionId, audience)).emit(name, payload);
    }
  }
}
