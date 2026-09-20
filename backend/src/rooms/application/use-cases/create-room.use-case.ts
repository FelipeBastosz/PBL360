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
    const code = await this.generateUniqueCode();
    const accessToken = await this.generateUniqueAccessToken();

    const room = Room.create({
      tutorId: input.tutorId,
      name: input.name,
      code,
      accessToken,
      semester: input.semester,
    });

    return this.rooms.save(room);
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(6).toString('hex').toUpperCase();

      const existingRoom = await this.rooms.findByCode(code);

      if (existingRoom === null) {
        return code;
      }
    }

    throw new Error('Não foi possível gerar um código disponível.');
  }

  private async generateUniqueAccessToken(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const token = randomBytes(16).toString('hex');

      const existingRoom = await this.rooms.findByAccessToken(token);

      if (existingRoom === null) {
        return token;
      }
    }

    throw new Error('Não foi possível gerar um token disponível.');
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
