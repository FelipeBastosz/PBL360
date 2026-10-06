import { useState } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import type { SessionAttachment } from '@/types/session';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

const ICON_BUTTON_CLASS =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,scale] duration-200 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900';

type RowProps = {
  attachment: SessionAttachment;
  canDelete: boolean;
  onDownload: () => void;
  onDelete: () => Promise<void>;
};

function DeleteConfirmation({
  fileName,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  fileName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="group"
      aria-label={`Confirmar exclusão de ${fileName}`}
      className="flex w-full animate-fade-up items-center justify-end gap-2 border-t border-black/5 pt-3 [animation-duration:200ms]"
    >
      <span className="mr-auto text-sm text-ink">Excluir este documento?</span>
      <button
        type="button"
        onClick={onCancel}
        disabled={isDeleting}
        className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-black/5"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isDeleting}
        className="inline-flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white transition-[scale] duration-200 hover:opacity-90 active:scale-95 disabled:opacity-70"
      >
        {isDeleting && <Spinner className="size-4" />}
        Excluir
      </button>
    </div>
  );
}

function RowActions({
  fileName,
  canDelete,
  isConfirming,
  onDownload,
  onAskDelete,
}: {
  fileName: string;
  canDelete: boolean;
  isConfirming: boolean;
  onDownload: () => void;
  onAskDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center">
      <button
        type="button"
        onClick={onDownload}
        aria-label={`Baixar ${fileName}`}
        className={cn(ICON_BUTTON_CLASS, 'text-brand-900 hover:bg-brand-50')}
      >
        <ArrowDownTrayIcon className="size-5" aria-hidden />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={onAskDelete}
          aria-label={`Excluir ${fileName}`}
          aria-expanded={isConfirming}
          className={cn(ICON_BUTTON_CLASS, 'text-danger hover:bg-danger-soft')}
        >
          <TrashIcon className="size-5" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function SessionAttachmentRow({ attachment, canDelete, onDownload, onDelete }: RowProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    setIsConfirming(false);
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-black/5 bg-surface p-3 animate-fade-up [animation-duration:260ms]">
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
      <RowActions
        fileName={attachment.nomeArquivo}
        canDelete={canDelete}
        isConfirming={isConfirming}
        onDownload={onDownload}
        onAskDelete={() => setIsConfirming(true)}
      />
      {isConfirming && (
        <DeleteConfirmation
          fileName={attachment.nomeArquivo}
          isDeleting={isDeleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setIsConfirming(false)}
        />
      )}
    </li>
  );
}
