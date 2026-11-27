import { GradeRecalculationNoticesController } from './grade-recalculation-notices.controller';

describe('GradeRecalculationNoticesController', () => {
  it('lists notices for the authenticated student id', async () => {
    const notices = [{ id: 'n1', sessaoId: 's1', notaAnterior: 7, notaAtualizada: 8 }];
    const list = { execute: jest.fn().mockResolvedValue(notices) };
    const controller = new GradeRecalculationNoticesController(list as never);
    await expect(controller.get('student-1')).resolves.toBe(notices);
    expect(list.execute).toHaveBeenCalledWith('student-1');
  });
});
