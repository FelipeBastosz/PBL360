import { StudentPerformanceController } from './student-performance.controller';

describe('StudentPerformanceController', () => {
  it('forwards room, student, tutor and optional problem filters', async () => {
    const performance = { execute: jest.fn().mockResolvedValue({ studentId: 's1', sessions: [] }) };
    const controller = new StudentPerformanceController(performance as never);
    const result = { studentId: 's1', sessions: [] };
    await expect(controller.get('r1', 's1', 't1', { problemaId: 'p1' })).resolves.toEqual(result);
    expect(performance.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      studentId: 's1',
      tutorId: 't1',
      problemId: 'p1',
    });
    await controller.get('r1', 's1', 't1', {});
    expect(performance.execute).toHaveBeenLastCalledWith({
      roomId: 'r1',
      studentId: 's1',
      tutorId: 't1',
      problemId: undefined,
    });
  });
});
