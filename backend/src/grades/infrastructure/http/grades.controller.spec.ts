import { GradesController } from './grades.controller';

describe('GradesController', () => {
  it('fetches problem grades using the room, problem and tutor ids', async () => {
    const response = { students: [] };
    const getGrades = { execute: jest.fn().mockResolvedValue(response) };
    const controller = new GradesController(getGrades as never);
    await expect(controller.get('r1', 'p1', 't1')).resolves.toBe(response);
    expect(getGrades.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      tutorId: 't1',
    });
  });
});
