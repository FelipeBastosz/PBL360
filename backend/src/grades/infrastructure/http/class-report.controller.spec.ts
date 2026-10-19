import { ClassReportController } from './class-report.controller';
import type { GetClassFinalReportUseCase } from '../../application/use-cases/get-class-final-report.use-case';
import type { ClassFinalReportResponseDto } from '../../application/dtos/class-final-report-response.dto';

describe('ClassReportController', () => {
  let controller: ClassReportController;
  let getClassFinalReport: jest.Mocked<GetClassFinalReportUseCase>;

  const mockResponse: ClassFinalReportResponseDto = {
    sala: {
      id: 'room-1',
      nome: 'Turma A',
      codigoDisciplina: 'EXA123',
      semestre: '2026.2',
    },
    problemas: [],
    alunos: [],
  };

  beforeEach(() => {
    getClassFinalReport = {
      execute: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as jest.Mocked<GetClassFinalReportUseCase>;

    controller = new ClassReportController(getClassFinalReport);
  });

  it('delegates report generation to the use case with roomId and tutorId', async () => {
    const result = await controller.get('room-1', 'tutor-1');

    expect(result).toBe(mockResponse);
    expect(getClassFinalReport.execute).toHaveBeenCalledWith({
      roomId: 'room-1',
      tutorId: 'tutor-1',
    });
  });
});
