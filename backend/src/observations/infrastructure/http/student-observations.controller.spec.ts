import { StudentObservationsController } from './student-observations.controller';

describe('StudentObservationsController', () => {
  it('lists student observations for the session and tutor', async () => {
    const observations = [
      {
        id: 'o1',
        tags: [{ id: 'tag1', name: 'Colaboração' }],
        text: 'Contribuiu',
        createdAt: new Date('2025-01-01'),
      },
    ];
    const list = { execute: jest.fn().mockResolvedValue({ observations, tagCounts: { tag1: 1 } }) };
    const register = { execute: jest.fn() };
    const controller = new StudentObservationsController(list as never, register as never);

    await expect(controller.list('session-1', 'student-1', 'tutor-1')).resolves.toMatchObject({
      observacoes: [{ id: 'o1', marcacoes: [{ id: 'tag1', nome: 'Colaboração' }] }],
      contagem: { tag1: 1 },
    });
    expect(list.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
    });
  });

  it('registers an observation with defaulted optional text and tags', async () => {
    const created = { id: 'o2', tags: [], text: null, createdAt: new Date('2025-01-02') };
    const list = { execute: jest.fn() };
    const register = { execute: jest.fn().mockResolvedValue(created) };
    const controller = new StudentObservationsController(list as never, register as never);

    await expect(
      controller.register('session-1', 'student-1', {}, 'tutor-1'),
    ).resolves.toMatchObject({
      id: 'o2',
      marcacoes: [],
      texto: null,
    });
    expect(register.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
      text: null,
      tagIds: [],
    });
  });
});
