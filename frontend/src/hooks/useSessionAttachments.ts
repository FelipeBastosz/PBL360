import { useCallback, useEffect, useState } from 'react';
import { toApiError } from '@/services/apiError';
import { sessionService } from '@/services/session.service';
import type { SessionAttachment } from '@/types/session';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export function validateAttachment(file: File): string | null {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) return 'Envie um arquivo PDF.';
  if (file.size > MAX_ATTACHMENT_BYTES) return 'O arquivo deve ter no máximo 10 MB.';
  return null;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
}

function useAttachmentList(sessionId: string) {
  const [attachments, setAttachments] = useState<SessionAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    sessionService
      .listAttachments(sessionId)
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  return { attachments, setAttachments, isLoading };
}

export function useSessionAttachments(sessionId: string) {
  const { attachments, setAttachments, isLoading } = useAttachmentList(sessionId);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      const invalid = validateAttachment(file);
      if (invalid) return invalid;
      setIsUploading(true);
      try {
        const saved = await sessionService.uploadAttachment(sessionId, file);
        setAttachments((current) => [saved, ...current]);
        return null;
      } catch (caught) {
        return toApiError(caught).message;
      } finally {
        setIsUploading(false);
      }
    },
    [sessionId, setAttachments],
  );

  const download = useCallback(
    async (attachment: SessionAttachment) => {
      saveBlob(
        await sessionService.downloadAttachment(sessionId, attachment.id),
        attachment.nomeArquivo,
      );
    },
    [sessionId],
  );

  const remove = useCallback(
    async (attachment: SessionAttachment): Promise<string | null> => {
      try {
        await sessionService.deleteAttachment(sessionId, attachment.id);
        setAttachments((current) => current.filter((item) => item.id !== attachment.id));
        return null;
      } catch (caught) {
        return toApiError(caught).message;
      }
    },
    [sessionId, setAttachments],
  );

  return { attachments, isLoading, isUploading, upload, download, remove };
}
