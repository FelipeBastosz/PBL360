import { getMetadataArgsStorage } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Room } from './room.entity';
import { RoomStudent } from './room-student.entity';

describe('RoomStudent mapping', () => {
  it('maps the room membership to its room and student', () => {
    const targets = getMetadataArgsStorage()
      .relations.filter((relation) => relation.target === RoomStudent)
      .map((relation) =>
        typeof relation.type === 'function' ? (relation.type() as unknown) : relation.type,
      );

    expect(targets).toEqual([Room, User]);
  });
});
