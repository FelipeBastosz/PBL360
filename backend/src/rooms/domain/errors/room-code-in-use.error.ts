export class RoomCodeInUseError extends Error {
  constructor(roomCode: string) {
    super(`Room code ${roomCode} is already in use.`);
    this.name = 'RoomCodeInUseError';
  }
}
