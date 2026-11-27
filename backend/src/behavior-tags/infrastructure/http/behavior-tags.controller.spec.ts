import { BehaviorTag } from '../../domain/entities/behavior-tag.entity';
import { BehaviorTagsController } from './behavior-tags.controller';

describe('BehaviorTagsController', () => {
  it('maps list, create and rename requests and delegates deactivation', async () => {
    const tag = Object.assign(BehaviorTag.create({ tutorId: 't1', name: 'Colaboração' }), {
      id: 'tag1',
    });
    const list = { execute: jest.fn().mockResolvedValue([tag]) };
    const create = { execute: jest.fn().mockResolvedValue(tag) };
    const rename = { execute: jest.fn().mockResolvedValue(tag) };
    const deactivate = { execute: jest.fn().mockResolvedValue(undefined) };
    const controller = new BehaviorTagsController(
      list as never,
      create as never,
      rename as never,
      deactivate as never,
    );

    await expect(controller.list('t1')).resolves.toEqual([
      { id: 'tag1', nome: 'Colaboração', predefinida: false, ativa: true },
    ]);
    expect(list.execute).toHaveBeenCalledWith('t1');
    await expect(controller.create({ nome: 'Colaboração' }, 't1')).resolves.toMatchObject({
      id: 'tag1',
    });
    expect(create.execute).toHaveBeenCalledWith({ tutorId: 't1', name: 'Colaboração' });
    await expect(
      controller.rename('tag1', { nome: 'Trabalho em equipe' }, 't1'),
    ).resolves.toMatchObject({ id: 'tag1' });
    expect(rename.execute).toHaveBeenCalledWith({
      id: 'tag1',
      tutorId: 't1',
      name: 'Trabalho em equipe',
    });
    await expect(controller.deactivate('tag1', 't1')).resolves.toBeUndefined();
    expect(deactivate.execute).toHaveBeenCalledWith({ id: 'tag1', tutorId: 't1' });
  });
});
