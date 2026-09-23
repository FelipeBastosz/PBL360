import { InvalidRoomError } from '../errors/invalid-room.error';
import type { NewRoom } from './new-room';
import { Room } from './room.entity';

function validRoomData(): NewRoom {
  return {
    tutorId: 'tutor-123',
    name: 'Engenharia de Software',
    code: 'ABC123',
    accessToken: 'token-123',
    semester: '2026.2',
  };
}

describe('Room', () => {
  it('creates a room with valid data', () => {
    const room = Room.create(validRoomData());
    expect(room.name).toBe('Engenharia de Software');
  });

  it('creates a room as active', () => {
    const room = Room.create(validRoomData());
    expect(room.active).toBe(true);
  });

  it('removes surrounding spaces from the room name', () => {
    const room = Room.create({ ...validRoomData(), name: '  Engenharia de Software  ' });
    expect(room.name).toBe('Engenharia de Software');
  });

  it('removes surrounding spaces from the semester', () => {
    const room = Room.create({ ...validRoomData(), semester: '  2026.2  ' });
    expect(room.semester).toBe('2026.2');
  });

  it('removes surrounding spaces from access data', () => {
    const room = Room.create({
      ...validRoomData(),
      tutorId: '  tutor-123  ',
      code: '  ABC123  ',
      accessToken: '  token-123  ',
    });

    expect(room.tutorId).toBe('tutor-123');
    expect(room.code).toBe('ABC123');
    expect(room.accessToken).toBe('token-123');
  });

  it('rejects a room with an empty name', () => {
    expect(() => Room.create({ ...validRoomData(), name: '   ' })).toThrow(InvalidRoomError);
  });

  it('rejects a room name longer than 120 characters', () => {
    expect(() => Room.create({ ...validRoomData(), name: 'A'.repeat(121) })).toThrow(
      InvalidRoomError,
    );
  });

  it('accepts a room name with 120 characters', () => {
    const room = Room.create({ ...validRoomData(), name: 'A'.repeat(120) });
    expect(room.name).toHaveLength(120);
  });

  it('rejects a room with an empty semester', () => {
    expect(() => Room.create({ ...validRoomData(), semester: '   ' })).toThrow(InvalidRoomError);
  });

  it('rejects a semester longer than 10 characters', () => {
    expect(() => Room.create({ ...validRoomData(), semester: 'A'.repeat(11) })).toThrow(
      InvalidRoomError,
    );
  });

  it('accepts a semester with 10 characters', () => {
    const room = Room.create({ ...validRoomData(), semester: 'A'.repeat(10) });
    expect(room.semester).toHaveLength(10);
  });

  it('rejects a room without a tutor', () => {
    expect(() => Room.create({ ...validRoomData(), tutorId: '   ' })).toThrow(InvalidRoomError);
  });

  it('rejects a room with an empty code', () => {
    expect(() => Room.create({ ...validRoomData(), code: '   ' })).toThrow(InvalidRoomError);
  });

  it('rejects a room code with 12 characters', () => {
    expect(() => Room.create({ ...validRoomData(), code: 'A'.repeat(12) })).toThrow(
      InvalidRoomError,
    );
  });

  it('accepts a room code with three letters and three numbers', () => {
    const room = Room.create({ ...validRoomData(), code: 'EXA123' });
    expect(room.code).toBe('EXA123');
  });

  it('converts lowercase letters in the room code to uppercase', () => {
    const room = Room.create({ ...validRoomData(), code: 'exa123' });
    expect(room.code).toBe('EXA123');
  });

  it('rejects a room code with an invalid format', () => {
    expect(() => Room.create({ ...validRoomData(), code: 'SALA1234' })).toThrow(InvalidRoomError);
  });

  it('rejects a room with an empty access token', () => {
    expect(() => Room.create({ ...validRoomData(), accessToken: '   ' })).toThrow(InvalidRoomError);
  });

  it('rejects an access token longer than 64 characters', () => {
    expect(() => Room.create({ ...validRoomData(), accessToken: 'A'.repeat(65) })).toThrow(
      InvalidRoomError,
    );
  });

  it('accepts an access token with 64 characters', () => {
    const room = Room.create({ ...validRoomData(), accessToken: 'A'.repeat(64) });
    expect(room.accessToken).toHaveLength(64);
  });
});
