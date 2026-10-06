import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { SessionAttachmentRepository } from '../../domain/repositories/session-attachment.repository';
import type { SessionAccessService } from '../services/session-access.service';
import { DeleteSessionAttachmentUseCase } from './delete-session-attachment.use-case';

const student = { id: 'student-1', type: UserType.STUDENT };
const tutor = { id: 'tutor-1', type: UserType.TUTOR };

describe('DeleteSessionAttachmentUseCase', () => {
  let access: jest.Mocked<Pick<SessionAccessService, 'assertMemberCanAccessSession'>>;
  let attachments: jest.Mocked<Pick<SessionAttachmentRepository, 'findUploader' | 'delete'>>;

  beforeEach(() => {
    access = { assertMemberCanAccessSession: jest.fn().mockResolvedValue({ roomId: 'room-1' }) };
    attachments = {
      findUploader: jest.fn().mockResolvedValue('student-1'),
      delete: jest.fn().mockResolvedValue(undefined),
    };
  });

  const remove = (member: { id: string; type: UserType }) =>
    new DeleteSessionAttachmentUseCase(
      access as unknown as SessionAccessService,
      attachments as unknown as SessionAttachmentRepository,
    ).execute({ sessionId: 'session-1', attachmentId: 'a1', member });

  it('lets a student delete an attachment they sent', async () => {
    await remove(student);

    expect(access.assertMemberCanAccessSession).toHaveBeenCalledWith('session-1', student);
    expect(attachments.findUploader).toHaveBeenCalledWith('session-1', 'a1');
    expect(attachments.delete).toHaveBeenCalledWith('a1');
  });

  it('keeps a student from deleting an attachment sent by someone else', async () => {
    attachments.findUploader.mockResolvedValue('student-2');

    await expect(remove(student)).rejects.toThrow(
      new ForbiddenError('Você só pode excluir os anexos que você enviou.'),
    );
    expect(attachments.delete).not.toHaveBeenCalled();
  });

  it('lets a tutor delete an attachment sent by anyone', async () => {
    await remove(tutor);

    expect(attachments.delete).toHaveBeenCalledWith('a1');
  });

  it('answers not found for an attachment of another session', async () => {
    attachments.findUploader.mockResolvedValue(null);

    await expect(remove(tutor)).rejects.toThrow(new NotFoundError('Anexo não encontrado.'));
    expect(attachments.delete).not.toHaveBeenCalled();
  });

  it('checks membership before looking for the attachment', async () => {
    access.assertMemberCanAccessSession.mockRejectedValue(new ForbiddenError('negado'));

    await expect(remove(student)).rejects.toBeInstanceOf(ForbiddenError);
    expect(attachments.findUploader).not.toHaveBeenCalled();
  });
});
