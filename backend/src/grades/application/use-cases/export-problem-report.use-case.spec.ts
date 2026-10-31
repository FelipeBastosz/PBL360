import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { FeedbackRepository } from '@/feedbacks/domain/repositories/feedback.repository';
import type { ReportFileGenerator } from '@/report-files/domain/services/report-file-generator';
import { ReportFileFormat, type ReportFile } from '@/report-files/domain/report-document';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { Room } from '@/rooms/domain/entities/room.entity';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import { ExportProblemReportUseCase } from './export-problem-report.use-case';
import type { GetProblemGradesUseCase } from './get-problem-grades.use-case';
import type { GradesResponseDto } from '../dtos/grades-response.dto';

describe('ExportProblemReportUseCase', () => {
  let useCase: ExportProblemReportUseCase;
  let roomAccess: jest.Mocked<Pick<RoomAccessService, 'assertTutorCanAccessRoom'>>;
  let problemRepository: jest.Mocked<Pick<ProblemRepository, 'findById'>>;
  let getProblemGrades: jest.Mocked<Pick<GetProblemGradesUseCase, 'execute'>>;
  let feedbackRepository: jest.Mocked<Pick<FeedbackRepository, 'findProblemFeedbacksWithDetails'>>;
  let reportFiles: jest.Mocked<ReportFileGenerator>;

  const input = {
    roomId: 'room-1',
    problemId: 'problem-1',
    tutorId: 'tutor-1',
    format: ReportFileFormat.PDF,
  };

  const room = {
    id: 'room-1',
    name: 'Turma A',
    courseCode: 'MED101',
    semester: '2026.2',
  } as Room;
  const problem = {
    id: 'problem-1',
    roomId: 'room-1',
    title: 'Problema 1',
    orderIndex: 1,
  } as Problem;
  const grades = {
    sessoes: [],
    alunos: [],
    mediaTurma: null,
    versoesFormula: { sessao: 1, problema: 1 },
  } as GradesResponseDto;
  const mockFile: ReportFile = {
    content: Buffer.from('%PDF-1.4 test'),
    fileName: 'relatorio-problema-1-Turma-A.pdf',
    contentType: 'application/pdf',
  };

  beforeEach(() => {
    roomAccess = {
      assertTutorCanAccessRoom: jest.fn().mockResolvedValue(room),
    };
    problemRepository = {
      findById: jest.fn().mockResolvedValue(problem),
    };
    getProblemGrades = {
      execute: jest.fn().mockResolvedValue(grades),
    };
    feedbackRepository = {
      findProblemFeedbacksWithDetails: jest.fn().mockResolvedValue([]),
    };
    reportFiles = {
      generate: jest.fn().mockResolvedValue(mockFile),
    };

    useCase = new ExportProblemReportUseCase(
      roomAccess as unknown as RoomAccessService,
      problemRepository as unknown as ProblemRepository,
      getProblemGrades as unknown as GetProblemGradesUseCase,
      feedbackRepository as unknown as FeedbackRepository,
      reportFiles,
    );
  });

  it('checks tutor room access and rejects when tutor has no permission', async () => {
    const error = new ForbiddenError('Acesso negado.');
    roomAccess.assertTutorCanAccessRoom.mockRejectedValue(error);

    await expect(useCase.execute(input)).rejects.toBe(error);
    expect(roomAccess.assertTutorCanAccessRoom).toHaveBeenCalledWith(input.roomId, input.tutorId);
    expect(problemRepository.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when problem is not found', async () => {
    problemRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toEqual(
      new NotFoundError('Problema não encontrado na sala informada.'),
    );
  });

  it('throws NotFoundError when problem belongs to a different room', async () => {
    problemRepository.findById.mockResolvedValue({ ...problem, roomId: 'other-room' } as Problem);

    await expect(useCase.execute(input)).rejects.toEqual(
      new NotFoundError('Problema não encontrado na sala informada.'),
    );
  });

  it('generates and returns report file when valid', async () => {
    const result = await useCase.execute(input);

    expect(result).toBe(mockFile);
    expect(getProblemGrades.execute).toHaveBeenCalledWith({
      roomId: input.roomId,
      problemId: input.problemId,
      tutorId: input.tutorId,
    });
    expect(feedbackRepository.findProblemFeedbacksWithDetails).toHaveBeenCalledWith(
      input.problemId,
    );
    expect(reportFiles.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        format: ReportFileFormat.PDF,
        title: 'Relatório do problema',
        fileName: 'relatorio-problema-1-Turma A',
        repeatIdentification: true,
        identification: [
          { label: 'Turma', value: 'Turma A' },
          { label: 'Disciplina', value: 'MED101' },
          { label: 'Semestre', value: '2026.2' },
          { label: 'Problema', value: 'Problema 1' },
        ],
      }),
    );
  });

  it('forwards ocultarNomes to document builder when specified', async () => {
    await useCase.execute({ ...input, ocultarNomes: true });

    const [call] = reportFiles.generate.mock.calls;
    const document = call?.[0];
    expect(document?.title).toBe('Relatório do problema');
    const table = document?.sections[0];
    expect(table?.kind).toBe('table');
    if (table?.kind === 'table') {
      expect(table.columns[0]).toEqual(expect.objectContaining({ header: 'Matrícula' }));
    }
  });
});
