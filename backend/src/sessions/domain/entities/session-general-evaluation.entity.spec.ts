import { getMetadataArgsStorage } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Session } from './session.entity';
import { SessionGeneralEvaluation } from './session-general-evaluation.entity';

describe('SessionGeneralEvaluation mapping', () => {
  it('maps the evaluated session, author and editor relationships', () => {
    const targets = getMetadataArgsStorage()
      .relations.filter((relation) => relation.target === SessionGeneralEvaluation)
      .map((relation) =>
        typeof relation.type === 'function' ? (relation.type() as unknown) : relation.type,
      );

    expect(targets).toEqual([Session, User, User]);
  });
});
