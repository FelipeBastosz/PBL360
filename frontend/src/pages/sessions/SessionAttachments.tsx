import { useRef } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useSessionAttachments } from '@/hooks/useSessionAttachments';
import { useToast } from '@/hooks/useToast';
import type { SessionAttachment } from '@/types/session';
import { countLabel } from '@/utils/countLabel';
import { SessionAttachmentRow } from './SessionAttachmentRow';

type SessionAttachmentsProps = {
  sessionId: string;
  canUpload?: boolean;
};

type AttachmentListProps = {
  attachments: SessionAttachment[];
  canDelete: (a: SessionAttachment) => boolean;
  onDownload: (a: SessionAttachment) => void;
  onDelete: (a: SessionAttachment) => Promise<void>;
};

function AttachmentList({ attachments, canDelete, onDownload, onDelete }: AttachmentListProps) {
  if (!attachments.length) {
    return <p className="py-2 text-center text-sm text-muted">Nenhum documento anexado ainda.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {attachments.map((attachment) => (
        <SessionAttachmentRow
          key={attachment.id}
          attachment={attachment}
          canDelete={canDelete(attachment)}
          onDownload={() => onDownload(attachment)}
          onDelete={() => onDelete(attachment)}
        />
      ))}
    </ul>
  );
}

function UploadControl({
  isUploading,
  onFile,
}: {
  isUploading: boolean;
  onFile: (file: File | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-label="Documento PDF"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <Button onClick={() => inputRef.current?.click()} isLoading={isUploading}>
        <PlusIcon className="size-5" strokeWidth={2.5} aria-hidden />
        Adicionar Documento
      </Button>
      <p className="text-center text-xs text-muted">Apenas PDF, de até 10 MB.</p>
    </>
  );
}

function useAttachmentActions(sessionId: string) {
  const { notify } = useToast();
  const { user } = useAuth();
  const { attachments, isLoading, isUploading, upload, download, remove } =
    useSessionAttachments(sessionId);
  const report = (error: string | null, success: string) =>
    notify(error ? { tone: 'error', message: error } : { tone: 'success', message: success });

  return {
    attachments,
    isLoading,
    isUploading,
    canDelete: (attachment: SessionAttachment) =>
      user?.tipo === 'PROFESSOR' || attachment.enviadoPor.id === user?.id,
    handleFile: async (file: File | undefined) => {
      if (file) report(await upload(file), 'Documento anexado.');
    },
    handleDownload: (attachment: SessionAttachment) =>
      download(attachment).catch(() =>
        notify({ tone: 'error', message: 'Não foi possível baixar o documento.' }),
      ),
    handleDelete: async (attachment: SessionAttachment) =>
      report(await remove(attachment), 'Documento excluído.'),
  };
}

export function SessionAttachments({ sessionId, canUpload = false }: SessionAttachmentsProps) {
  const {
    attachments,
    isLoading,
    isUploading,
    canDelete,
    handleFile,
    handleDownload,
    handleDelete,
  } = useAttachmentActions(sessionId);

  return (
    <section aria-labelledby="session-attachments-title" className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h2 id="session-attachments-title" className="text-lg font-semibold text-brand-900">
          Anexos da Sessão
        </h2>
        <span className="text-sm text-muted">
          {countLabel(attachments.length, 'arquivo', 'arquivos')}
        </span>
      </header>
      <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgb(16_33_76/0.06)]">
        {isLoading ? (
          <Spinner className="mx-auto size-6 text-brand-900" />
        ) : (
          <AttachmentList
            attachments={attachments}
            canDelete={canDelete}
            onDownload={(a) => void handleDownload(a)}
            onDelete={handleDelete}
          />
        )}
        {canUpload && (
          <UploadControl isUploading={isUploading} onFile={(file) => void handleFile(file)} />
        )}
      </div>
    </section>
  );
}
