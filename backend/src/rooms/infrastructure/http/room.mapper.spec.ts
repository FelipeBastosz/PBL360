import { InvalidRequestError } from '@/shared/errors/application.error';
import { User } from '@/users/domain/entities/user.entity';
import { buildRoom } from '../../testing/room-fixtures';
import { roomCodeFromInviteLink, toRoomSummaryResponse } from './room.mapper';

describe('toRoomSummaryResponse', () => {
  it('maps the room and its student and problem totals', () => {
    expect(
      toRoomSummaryResponse({
        room: buildRoom(),
        totalStudents: 24,
        totalProblems: 8,
      }),
    ).toMatchObject({ totalAlunos: 24, totalProblemas: 8, nome: 'Engenharia de Software' });
  });

  it('maps professorResponsavel when room.tutor is present', () => {
    const room = buildRoom();
    room.tutor = Object.assign(new User(), {
      id: 'tutor-1',
      name: 'Carlos Mendes',
      email: 'carlos@uefs.br',
    });

    expect(
      toRoomSummaryResponse({
        room,
        totalStudents: 10,
        totalProblems: 2,
      }),
    ).toMatchObject({
      professorResponsavel: {
        id: 'tutor-1',
        nome: 'Carlos Mendes',
        email: 'carlos@uefs.br',
      },
    });
  });
});

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
