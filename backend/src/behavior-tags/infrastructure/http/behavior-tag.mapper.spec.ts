import { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import { toBehaviorTagResponse } from './behavior-tag.mapper';

describe('toBehaviorTagResponse', () => {
  it('marks a tag without tutor as predefined', () => {
    const tag = Object.assign(BehaviorTag.create({ name: 'Atraso' }), { id: 'tag-1' });

    expect(toBehaviorTagResponse(tag)).toEqual({
      id: 'tag-1',
      nome: 'Atraso',
      predefinida: true,
      ativa: true,
    });
  });

  it('marks a tutor tag as not predefined', () => {
    const tag = BehaviorTag.create({ name: 'Liderou', tutorId: 'tutor-1' });

    expect(toBehaviorTagResponse(tag).predefinida).toBe(false);
  });
});
