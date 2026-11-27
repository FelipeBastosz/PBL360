import { Logger } from '@nestjs/common';
import { PlanningPokerGateway, pokerRoom } from './planning-poker.gateway';

describe('PlanningPokerGateway', () => {
  it('authenticates sockets, joins the audience room, and confirms the role', async () => {
    const authenticator = {
      authenticate: jest.fn().mockResolvedValue({ sessionId: 'session-1', audience: 'STUDENT' }),
    };
    const gateway = new PlanningPokerGateway(authenticator as never);
    const client = {
      handshake: { auth: { token: 'jwt' } },
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(authenticator.authenticate).toHaveBeenCalledWith(client.handshake.auth);
    expect(client.join).toHaveBeenCalledWith(pokerRoom('session-1', 'STUDENT'));
    expect(client.emit).toHaveBeenCalledWith('poker.conectado', { perfil: 'ALUNO' });
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('rejects failed handshakes and supplies a fallback for non-error failures', async () => {
    for (const [failure, message] of [
      [new Error('Token inválido.'), 'Token inválido.'],
      ['failure', 'Conexão recusada.'],
    ] as const) {
      const gateway = new PlanningPokerGateway({
        authenticate: jest.fn().mockRejectedValue(failure),
      } as never);
      const client = {
        handshake: { auth: {} },
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      await gateway.handleConnection(client as never);

      expect(client.emit).toHaveBeenCalledWith('poker.erro', { mensagem: message });
      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    }
  });

  it('warns when unavailable and publishes tailored events to both audiences', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const gateway = new PlanningPokerGateway({} as never);
    const event = { type: 'CLOSED', pokerId: 'poker-1' } as const;
    gateway.publish('session-1', event);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('gateway not ready'));

    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    (gateway as unknown as { server: { to: typeof to } }).server = { to };
    gateway.publish('session-1', event);
    expect(to).toHaveBeenCalledTimes(2);
    expect(to).toHaveBeenNthCalledWith(1, 'poker:session-1:TUTOR');
    expect(to).toHaveBeenNthCalledWith(2, 'poker:session-1:STUDENT');
    expect(emit).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
