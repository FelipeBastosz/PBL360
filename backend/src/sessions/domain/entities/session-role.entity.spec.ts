import { getMetadataArgsStorage } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Session } from './session.entity';
import { SessionRoleAssignment } from './session-role.entity';

describe('SessionRoleAssignment mapping', () => {
  it('maps the assigned session and student relationships', () => {
    const targets = getMetadataArgsStorage()
      .relations.filter((relation) => relation.target === SessionRoleAssignment)
      .map((relation) =>
        typeof relation.type === 'function' ? (relation.type() as unknown) : relation.type,
      );

    expect(targets).toEqual([Session, User]);
  });
});
