import { getMetadataArgsStorage } from 'typeorm';
import { CommitmentTerm } from './commitment-term.entity';
import { UserTermAcceptance } from './user-term-acceptance.entity';
import { User } from '@/users/domain/entities/user.entity';

describe('UserTermAcceptance', () => {
  it('creates an acceptance with trimmed version and server date', () => {
    const acceptance = UserTermAcceptance.create({
      userId: '11111111-1111-1111-1111-111111111111',
      termId: '22222222-2222-2222-2222-222222222222',
      termVersion: ' 1.0 ',
    });

    expect(acceptance.userId).toBe('11111111-1111-1111-1111-111111111111');
    expect(acceptance.termId).toBe('22222222-2222-2222-2222-222222222222');
    expect(acceptance.termVersion).toBe('1.0');
    expect(acceptance.acceptedAt).toBeInstanceOf(Date);
  });

  it('preserves a supplied server timestamp', () => {
    const acceptedAt = new Date('2026-11-20T12:00:00.000Z');
    const acceptance = UserTermAcceptance.create({
      userId: '11111111-1111-1111-1111-111111111111',
      termId: '22222222-2222-2222-2222-222222222222',
      termVersion: '1.2',
      acceptedAt,
    });

    expect(acceptance.acceptedAt).toBe(acceptedAt);
  });

  it('keeps user and term relations connected to their entity types', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      ({ target }) => target === UserTermAcceptance,
    );
    const relatedTypes: unknown[] = relations.map(({ type }): unknown => {
      if (typeof type !== 'function') return type;
      return Reflect.apply(type as (...args: never[]) => unknown, undefined, []);
    });

    expect(relatedTypes).toEqual([User, CommitmentTerm]);
  });

  it('declares a database generated acceptance timestamp default', () => {
    const acceptedAt = getMetadataArgsStorage().columns.find(
      ({ target, propertyName }) => target === UserTermAcceptance && propertyName === 'acceptedAt',
    );

    expect(typeof acceptedAt?.options.default).toBe('function');
    expect(
      Reflect.apply(acceptedAt!.options.default as (...args: never[]) => unknown, undefined, []),
    ).toBe('now()');
  });
});
