import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Room } from '../../domain/entities/room.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import { InvalidRoomError } from '../../domain/errors/invalid-room.error';
import { ROOM_REPOSITORY, type RoomRepository } from '../../domain/repositories/room.repository';

export interface CreateRoomInput {
  tutorId: string;
  name: string;
  courseCode: string;
  semester: string;
}

@Injectable()
export class CreateRoomUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly rooms: RoomRepository,

    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(input: CreateRoomInput): Promise<Room> {
    await this.assertTutorExists(input.tutorId);
    const courseCode = input.courseCode.trim().toUpperCase();
    const roomCode = await this.generateUniqueRoomCode();

    const room = Room.create({
      tutorId: input.tutorId,
      name: input.name,
      courseCode,
      roomCode,
      semester: input.semester,
    });

    return this.rooms.save(room);
  }

  private async generateUniqueRoomCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let attempt = 0; attempt < 5; attempt++) {
      const roomCode = Array.from(
        randomBytes(8),
        (byte) => characters[byte % characters.length],
      ).join('');

      const existingRoom = await this.rooms.findByRoomCode(roomCode);

      if (existingRoom === null) {
        return roomCode;
      }
    }

    throw new Error('Não foi possível gerar um código de sala disponível.');
  }

  private async assertTutorExists(tutorId: string): Promise<void> {
    const tutor = await this.users.findById(tutorId);

    if (tutor === null) {
      throw new InvalidRoomError('O professor responsável não foi encontrado.');
    }

    if (!tutor.isTutor()) {
      throw new InvalidRoomError('O usuário informado não é um professor.');
    }
  }
}
