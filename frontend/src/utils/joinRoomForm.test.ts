import { describe, expect, it } from 'vitest';
import { toJoinRoomRequest, validateJoinRoomForm } from './joinRoomForm';

describe('toJoinRoomRequest', () => {
  it('keeps the code as typed, since room codes are case-sensitive', () => {
    expect(toJoinRoomRequest('  aB7kP2x9 ')).toEqual({ kind: 'code', codigoSala: 'aB7kP2x9' });
  });

  it('recognizes a pasted invite link', () => {
    expect(toJoinRoomRequest('https://pbl360.com/salas/aB7kP2x9')).toEqual({
      kind: 'link',
      link: 'https://pbl360.com/salas/aB7kP2x9',
    });
  });

  it.each(['aB7kP2x', 'aB7kP2x9X', 'aB7-P2x9', 'https://pbl360.com/turmas/aB7kP2x9', ''])(
    'rejects %j',
    (input) => {
      expect(toJoinRoomRequest(input)).toBeNull();
    },
  );
});

describe('validateJoinRoomForm', () => {
  it('requires the code', () => {
    expect(validateJoinRoomForm({ codigo: '   ' })).toEqual({
      codigo: 'Informe o código da turma.',
    });
  });

  it('explains the expected format when the code is malformed', () => {
    expect(validateJoinRoomForm({ codigo: 'EXA613-T1' })).toEqual({
      codigo: 'O código deve ter 8 letras ou números (ex.: aB7kP2x9).',
    });
  });

  it('accepts a valid code', () => {
    expect(validateJoinRoomForm({ codigo: 'aB7kP2x9' })).toEqual({});
  });
});
