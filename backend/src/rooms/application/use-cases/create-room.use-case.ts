import { Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { Room } from '../../domain/entities/room.entity';
import { RoomCodeInUseError } from '../../domain/errors/room-code-in-use.error';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

export interface CreateRoomInput {
  tutorId: string;
  name: string;
  courseCode: string;
  semester: string;
}

const ROOM_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ROOM_CODE_LENGTH = 8;
const MAX_ATTEMPTS = 5;

export const generateRoomCode = (): string =>
  Array.from(
    { length: ROOM_CODE_LENGTH },
    () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)],
  ).join('');

@Injectable()
export class CreateRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly rooms: RoomRepository,
  ) {}

  async execute(input: CreateRoomInput): Promise<Room> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.rooms.create(Room.create({ ...input, roomCode: generateRoomCode() }));
      } catch (error) {
        if (!(error instanceof RoomCodeInUseError) || attempt >= MAX_ATTEMPTS) {
          throw error;
        }
      }
    }
  }
}
