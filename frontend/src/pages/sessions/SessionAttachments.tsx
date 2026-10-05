import { useRef } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useSessionAttachments } from '@/hooks/useSessionAttachments';
import { useToast } from '@/hooks/useToast';
import type { SessionAttachment } from '@/types/session';
import { countLabel } from '@/utils/countLabel';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

type SessionAttachmentsProps = {
  sessionId: string;
  canUpload?: boolean;
};

function AttachmentRow({
  attachment,
  onDownload,
}: {
  attachment: SessionAttachment;
  onDownload: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-black/5 bg-surface p-3 animate-fade-up [animation-duration:260ms]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
        <DocumentTextIcon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{attachment.nomeArquivo}</p>
        <p className="truncate text-xs text-muted">
          Enviado por {attachment.enviadoPor.nome.split(' ')[0]} •{' '}
          {formatRelativeTime(attachment.enviadoEm)}
        </p>
      </div>
      <button
        type="button"
        onClick={onDownload}
        aria-label={`Baixar ${attachment.nomeArquivo}`}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-brand-900 transition-[background-color,scale] duration-200 hover:bg-brand-50 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900"
      >
        <ArrowDownTrayIcon className="size-5" aria-hidden />
      </button>
    </li>
  );
}

function AttachmentList({
  attachments,
  onDownload,
}: {
  attachments: SessionAttachment[];
  onDownload: (a: SessionAttachment) => void;
}) {
  if (!attachments.length) {
    return <p className="py-2 text-center text-sm text-muted">Nenhum documento anexado ainda.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {attachments.map((attachment) => (
        <AttachmentRow
          key={attachment.id}
          attachment={attachment}
          onDownload={() => onDownload(attachment)}
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

export function SessionAttachments({ sessionId, canUpload = false }: SessionAttachmentsProps) {
  const { notify } = useToast();
  const { attachments, isLoading, isUploading, upload, download } =
    useSessionAttachments(sessionId);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const error = await upload(file);
    notify(
      error
        ? { tone: 'error', message: error }
        : { tone: 'success', message: 'Documento anexado.' },
    );
  }

  async function handleDownload(attachment: SessionAttachment) {
    await download(attachment).catch(() =>
      notify({ tone: 'error', message: 'Não foi possível baixar o documento.' }),
    );
  }

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
          <AttachmentList attachments={attachments} onDownload={(a) => void handleDownload(a)} />
        )}
        {canUpload && (
          <UploadControl isUploading={isUploading} onFile={(file) => void handleFile(file)} />
        )}
      </div>
    </section>
  );
}
