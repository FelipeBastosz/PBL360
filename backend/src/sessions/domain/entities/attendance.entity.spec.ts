import { getMetadataArgsStorage } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Session } from './session.entity';
import { Attendance } from './attendance.entity';

describe('Attendance mapping', () => {
  it('maps attendance relationships to its session, student and recorder', () => {
    const targets = getMetadataArgsStorage()
      .relations.filter((relation) => relation.target === Attendance)
      .map((relation) =>
        typeof relation.type === 'function' ? (relation.type() as unknown) : relation.type,
      );

    expect(targets).toEqual([Session, User, User]);
  });
});
