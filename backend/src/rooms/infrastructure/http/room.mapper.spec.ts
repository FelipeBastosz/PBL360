import { InvalidRequestError } from '@/shared/errors/application.error';
import { roomCodeFromInviteLink } from './room.mapper';

describe('roomCodeFromInviteLink', () => {
  it('extracts the code used by the frontend invite URL', () => {
    expect(roomCodeFromInviteLink('https://pbl360.com/salas/aB7kP2x9')).toBe('aB7kP2x9');
  });

  it('rejects links that do not point to a room invite', () => {
    expect(() => roomCodeFromInviteLink('https://pbl360.com/outra/aB7kP2x9')).toThrow(
      new InvalidRequestError('O link de ingresso é inválido.'),
    );
  });
});
