import {
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
} from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { InvalidAttachmentError } from '../../domain/errors/invalid-attachment.error';
import type { SessionAttachmentRepository } from '../../domain/repositories/session-attachment.repository';
import type { SessionAccessService } from '../services/session-access.service';
import { DownloadSessionAttachmentUseCase } from './download-session-attachment.use-case';
import { ListSessionAttachmentsUseCase } from './list-session-attachments.use-case';
import { UploadSessionAttachmentUseCase } from './upload-session-attachment.use-case';

const student = { id: 'student-1', type: UserType.STUDENT };
const pdf = Buffer.from('%PDF-1.7\nconteudo');

describe('Session attachment use cases', () => {
  let access: jest.Mocked<Pick<SessionAccessService, 'assertMemberCanAccessSession'>>;
  let attachments: jest.Mocked<SessionAttachmentRepository>;

  beforeEach(() => {
    access = { assertMemberCanAccessSession: jest.fn().mockResolvedValue({ roomId: 'room-1' }) };
    attachments = {
      create: jest
        .fn()
        .mockImplementation((attachment) => Promise.resolve({ id: 'a1', ...attachment })),
      listBySession: jest.fn().mockResolvedValue([]),
      findFile: jest.fn(),
      findUploader: jest.fn(),
      delete: jest.fn(),
    };
  });

  const asAccess = () => access as unknown as SessionAccessService;

  describe('UploadSessionAttachmentUseCase', () => {
    const upload = (content: Buffer | undefined) =>
      new UploadSessionAttachmentUseCase(asAccess(), attachments).execute({
        sessionId: 'session-1',
        member: student,
        fileName: 'Pesquisa.pdf',
        content,
      });

    it('stores a PDF sent by a member as its uploader', async () => {
      await upload(pdf);

      expect(access.assertMemberCanAccessSession).toHaveBeenCalledWith('session-1', student);
      expect(attachments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          uploadedBy: 'student-1',
          fileName: 'Pesquisa.pdf',
        }),
      );
    });

    it('asks for the file when none was sent', async () => {
      await expect(upload(undefined)).rejects.toBeInstanceOf(InvalidRequestError);
      expect(attachments.create).not.toHaveBeenCalled();
    });

    it('refuses a file that is not a PDF', async () => {
      await expect(upload(Buffer.from('não é pdf'))).rejects.toBeInstanceOf(InvalidAttachmentError);
    });

    it('checks membership before reading the file', async () => {
      access.assertMemberCanAccessSession.mockRejectedValue(new ForbiddenError('negado'));

      await expect(upload(pdf)).rejects.toBeInstanceOf(ForbiddenError);
      expect(attachments.create).not.toHaveBeenCalled();
    });
  });

  it('lists the attachments of the session for a member', async () => {
    await new ListSessionAttachmentsUseCase(asAccess(), attachments).execute('session-1', student);

    expect(attachments.listBySession).toHaveBeenCalledWith('session-1');
  });

  describe('DownloadSessionAttachmentUseCase', () => {
    const download = () =>
      new DownloadSessionAttachmentUseCase(asAccess(), attachments).execute(
        'session-1',
        'a1',
        student,
      );

    it('returns the file of the session', async () => {
      attachments.findFile.mockResolvedValue({
        fileName: 'Pesquisa.pdf',
        mimeType: 'application/pdf',
        content: pdf,
      });

      await expect(download()).resolves.toMatchObject({ fileName: 'Pesquisa.pdf' });
      expect(attachments.findFile).toHaveBeenCalledWith('session-1', 'a1');
    });

    it('answers not found for an attachment of another session', async () => {
      attachments.findFile.mockResolvedValue(null);

      await expect(download()).rejects.toThrow(new NotFoundError('Anexo não encontrado.'));
    });
  });
});
