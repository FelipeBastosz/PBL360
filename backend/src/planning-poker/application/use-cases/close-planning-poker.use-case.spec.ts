import { ConflictError } from '@/shared/errors/application.error';
import { ClosePlanningPokerUseCase } from './close-planning-poker.use-case';

describe('ClosePlanningPokerUseCase', () => {
  const poker = { id: 'p1', sessionId: 's1', queue: ['s3'] };
  const students = new Map([
    ['s1', { id: 's1', name: 'Ana', initials: 'A', hasPhoto: false, seatNumber: 1 }],
    ['s2', { id: 's2', name: 'Bia', initials: 'B', hasPhoto: false, seatNumber: 2 }],
  ]);

  it('closes the poker and reports evaluated and pending students', async () => {
    const context = { forTutor: jest.fn().mockResolvedValue(poker) };
    const state = { students: jest.fn().mockResolvedValue(students) };
    const pokers = { close: jest.fn().mockResolvedValue(true) };
    const rounds = {
      findDecided: jest
        .fn()
        .mockResolvedValue([
          { studentId: 's1', average: 8, decision: { finalGrade: 9, adjusted: true } },
        ]),
      findOpen: jest.fn().mockResolvedValue({ studentId: 's2' }),
    };
    const events = { publish: jest.fn() };
    const useCase = new ClosePlanningPokerUseCase(
      context as never,
      state as never,
      pokers as never,
      rounds as never,
      events,
    );
    await expect(useCase.execute('s1', 't1')).resolves.toEqual({
      evaluated: 1,
      notEvaluated: [students.get('s2')],
      results: [{ student: students.get('s1'), average: 8, finalGrade: 9, adjusted: true }],
    });
    expect(events.publish).toHaveBeenCalledWith('s1', { type: 'CLOSED', pokerId: 'p1' });
  });

  it('rejects a poker that has already been closed', async () => {
    const context = { forTutor: jest.fn().mockResolvedValue(poker) };
    const state = { students: jest.fn().mockResolvedValue(students) };
    const pokers = { close: jest.fn().mockResolvedValue(false) };
    const rounds = {
      findDecided: jest.fn().mockResolvedValue([]),
      findOpen: jest.fn().mockResolvedValue(null),
    };
    const events = { publish: jest.fn() };
    const useCase = new ClosePlanningPokerUseCase(
      context as never,
      state as never,
      pokers as never,
      rounds as never,
      events,
    );
    await expect(useCase.execute('s1', 't1')).rejects.toThrow(
      new ConflictError('O planning poker já foi encerrado.'),
    );
    expect(events.publish).not.toHaveBeenCalled();
  });
});
