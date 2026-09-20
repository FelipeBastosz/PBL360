export class InvalidRoomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoomError';
  }
}
