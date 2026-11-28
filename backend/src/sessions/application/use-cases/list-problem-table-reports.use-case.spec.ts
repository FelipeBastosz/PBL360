import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { AttachmentCategory } from '../../domain/enums/attachment-category.enum';
import type {
  ProblemTableReportSummary,
  SessionAttachmentRepository,
} from '../../domain/repositories/session-attachment.repository';
import type { SessionAccessService } from '../services/session-access.service';
import { ListProblemTableReportsUseCase } from './list-problem-table-reports.use-case';

const member = { id: 'student-1', type: UserType.STUDENT };

const sampleReport = (): ProblemTableReportSummary => ({
  id: 'attachment-1',
  fileName: 'Relatorio_Mesa_S1.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 2048,
  category: AttachmentCategory.TABLE_REPORT,
  uploader: { id: 'tutor-1', name: 'Carlos Tutor' },
  createdAt: new Date('2026-10-01T14:30:00.000Z'),
  session: {
    id: 'session-1',
    title: 'Abertura',
    date: '2026-10-01',
    orderIndex: 1,
  },
});

describe('ListProblemTableReportsUseCase', () => {
  let access: jest.Mocked<Pick<SessionAccessService, 'assertMemberCanAccessProblem'>>;
  let attachments: jest.Mocked<Pick<SessionAttachmentRepository, 'listTableReportsByProblem'>>;
  let useCase: ListProblemTableReportsUseCase;

  beforeEach(() => {
    access = { assertMemberCanAccessProblem: jest.fn().mockResolvedValue(undefined) };
    attachments = { listTableReportsByProblem: jest.fn().mockResolvedValue([]) };
    useCase = new ListProblemTableReportsUseCase(
      access as unknown as SessionAccessService,
      attachments as unknown as SessionAttachmentRepository,
    );
  });

  it('validates room and problem membership before listing table reports', async () => {
    const reports = [sampleReport()];
    attachments.listTableReportsByProblem.mockResolvedValue(reports);

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      member,
    });

    expect(access.assertMemberCanAccessProblem).toHaveBeenCalledWith('room-1', 'problem-1', member);
    expect(attachments.listTableReportsByProblem).toHaveBeenCalledWith('room-1', 'problem-1');
    expect(result).toEqual(reports);
  });

  it('does not query reports when room membership check fails', async () => {
    access.assertMemberCanAccessProblem.mockRejectedValue(new ForbiddenError('negado'));

    await expect(
      useCase.execute({ roomId: 'room-1', problemId: 'problem-1', member }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(attachments.listTableReportsByProblem).not.toHaveBeenCalled();
  });

  it('propagates not found when problem does not belong to room', async () => {
    access.assertMemberCanAccessProblem.mockRejectedValue(
      new NotFoundError('Problema não encontrado.'),
    );

    await expect(
      useCase.execute({ roomId: 'room-1', problemId: 'problem-other-room', member }),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));

    expect(attachments.listTableReportsByProblem).not.toHaveBeenCalled();
  });
});
