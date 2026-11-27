import { TutorsController } from './tutors.controller';

describe('TutorsController', () => {
  it('searches tutors by the supplied query and maps API fields', async () => {
    const search = {
      execute: jest.fn().mockResolvedValue([{ id: 't1', name: 'Ana', email: 'ana@example.test' }]),
    };
    const controller = new TutorsController(search as never);
    await expect(controller.search({ busca: 'ana' })).resolves.toEqual([
      { id: 't1', nome: 'Ana', email: 'ana@example.test' },
    ]);
    expect(search.execute).toHaveBeenCalledWith('ana');
  });
});
