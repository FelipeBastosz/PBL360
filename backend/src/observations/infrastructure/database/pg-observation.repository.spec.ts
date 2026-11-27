import { Observation } from '../../domain/entities/observation.entity';
import { PgObservationRepository } from './pg-observation.repository';

describe('PgObservationRepository', () => {
  const row = {
    id: 'o1',
    sessionId: 'sess1',
    studentId: 's1',
    authorId: 't1',
    text: 'Observação',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    tags: [{ id: 'tag1', name: 'Participação' }],
  };

  it('returns a registration context or its empty defaults', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ studentEnrolled: true, usableTags: ['tag1'] }])
      .mockResolvedValueOnce([]);
    const repository = new PgObservationRepository({ query } as never);

    await expect(repository.findRegistrationContext('r1', 's1', 't1', ['tag1'])).resolves.toEqual({
      studentEnrolled: true,
      usableTags: ['tag1'],
    });
    await expect(repository.findRegistrationContext('r1', 's1', 't1', [])).resolves.toEqual({
      studentEnrolled: false,
      usableTags: [],
    });
  });

  it('creates observations with linked tag ids', async () => {
    const query = jest.fn().mockResolvedValue([{ id: 'o1', createdAt: row.createdAt }]);
    const repository = new PgObservationRepository({ query } as never);
    const observation = Object.assign(new Observation(), {
      sessionId: 'sess1',
      studentId: 's1',
      authorId: 't1',
      text: 'Observação',
      tags: [{ id: 'tag1', name: 'Participação' }],
    });

    await expect(repository.create(observation)).resolves.toMatchObject({
      id: 'o1',
      createdAt: row.createdAt,
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('WITH created AS'), [
      'sess1',
      's1',
      't1',
      'Observação',
      ['tag1'],
    ]);
  });

  it('finds, updates, deletes and lists observations for a student', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([row]);
    const update = jest.fn();
    const deleteRow = jest.fn();
    const repository = new PgObservationRepository({ query, update, delete: deleteRow } as never);

    await expect(repository.findById('o1')).resolves.toMatchObject({ id: 'o1', tags: row.tags });
    await expect(repository.findById('missing')).resolves.toBeNull();
    const observation = Object.assign(new Observation(), { id: 'o1', text: 'Atualizada' });
    await expect(repository.updateText(observation)).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith('o1', { text: 'Atualizada' });
    await expect(repository.delete('o1')).resolves.toBeUndefined();
    expect(deleteRow).toHaveBeenCalledWith('o1');
    await expect(repository.findForStudentInSession('sess1', 's1')).resolves.toMatchObject([
      { id: 'o1' },
    ]);
  });
});
