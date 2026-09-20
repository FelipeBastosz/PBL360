import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Room } from '../../domain/entities/room.entity';

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
  ) {}

  async execute(input: CreateRoomInput): Promise<Room> {
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
}
