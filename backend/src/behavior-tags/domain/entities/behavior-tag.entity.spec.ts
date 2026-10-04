import { BehaviorTag } from './behavior-tag.entity';

describe('BehaviorTag (Domain)', () => {
  it('creates a predefined tag when no tutor is given', () => {
    const tag = BehaviorTag.create({ nome: 'Atraso' });

    expect(tag.tutorId).toBeNull();
    expect(tag.isPredefined()).toBe(true);
  });

  it('creates a custom tag owned by a tutor', () => {
    const tag = BehaviorTag.create({ nome: 'Liderou o grupo', tutorId: 'tutor-1' });

    expect(tag.tutorId).toBe('tutor-1');
    expect(tag.isPredefined()).toBe(false);
  });

  it('starts every tag active', () => {
    expect(BehaviorTag.create({ nome: 'Atraso' }).ativa).toBe(true);
  });

  it('trims the name', () => {
    expect(BehaviorTag.create({ nome: '  Atraso  ' }).nome).toBe('Atraso');
  });

  it('deactivates the tag', () => {
    const tag = BehaviorTag.create({ nome: 'Atraso' });

    tag.deactivate();

    expect(tag.ativa).toBe(false);
  });

  it('trims the new name on rename', () => {
    const tag = BehaviorTag.create({ nome: 'Atraso', tutorId: 'tutor-1' });

    tag.rename('  Chegou tarde  ');

    expect(tag.nome).toBe('Chegou tarde');
  });

  describe('isOwnedBy', () => {
    it('is true for the tutor who created the tag', () => {
      expect(BehaviorTag.create({ nome: 'X', tutorId: 'tutor-1' }).isOwnedBy('tutor-1')).toBe(true);
    });

    it('is false for another tutor', () => {
      expect(BehaviorTag.create({ nome: 'X', tutorId: 'tutor-1' }).isOwnedBy('tutor-2')).toBe(
        false,
      );
    });

    it('is false for a predefined tag', () => {
      expect(BehaviorTag.create({ nome: 'Atraso' }).isOwnedBy('tutor-1')).toBe(false);
    });
  });
});
