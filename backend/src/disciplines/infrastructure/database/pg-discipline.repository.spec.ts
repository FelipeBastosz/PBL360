import type { Repository } from 'typeorm';
import { Discipline } from '../../domain/entities/discipline.entity';
import { PgDisciplineRepository } from './pg-discipline.repository';

describe('PgDisciplineRepository', () => {
  const createSubject = () => {
    const query = jest.fn<(...args: unknown[]) => Promise<unknown>>();
    const subject = new PgDisciplineRepository({ query } as unknown as Repository<Discipline>);
    return { query, subject };
  };

  it('lists disciplines ordered by code and maps their rows', async () => {
    const { query, subject } = createSubject();
    query.mockResolvedValue([
      { id: 'discipline-1', code: 'BIO101', name: 'Biologia' },
      { id: 'discipline-2', code: 'MED201', name: 'Medicina' },
    ]);

    const disciplines = await subject.findAll();

    expect(query).toHaveBeenCalledWith('SELECT id, code, name FROM disciplines ORDER BY code;');
    expect(disciplines).toEqual([
      expect.objectContaining({ id: 'discipline-1', code: 'BIO101', name: 'Biologia' }),
      expect.objectContaining({ id: 'discipline-2', code: 'MED201', name: 'Medicina' }),
    ]);
    expect(disciplines.every((discipline) => discipline instanceof Discipline)).toBe(true);
  });

  it('inserts and maps a new discipline', async () => {
    const { query, subject } = createSubject();
    query.mockResolvedValue([{ id: 'discipline-1', code: 'BIO101', name: 'Biologia' }]);
    const discipline = Discipline.create({ code: 'bio101', name: ' Biologia ' });

    await expect(subject.create(discipline)).resolves.toMatchObject({
      id: 'discipline-1',
      code: 'BIO101',
      name: 'Biologia',
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT (code) DO NOTHING'), [
      'BIO101',
      'Biologia',
    ]);
  });

  it('returns null when the discipline code already exists', async () => {
    const { query, subject } = createSubject();
    query.mockResolvedValue([]);

    await expect(
      subject.create(Discipline.create({ code: 'BIO101', name: 'Biologia' })),
    ).resolves.toBeNull();
  });
});
