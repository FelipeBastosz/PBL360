import { type FormEvent, useEffect, type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Alert } from '@/components/ui/Alert';
import { useForm } from '@/hooks/useForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { sessionService } from '@/services/session.service';
import { validateSessionForm, type SessionFormValues } from '@/utils/sessionsForm';
import type { Session } from '@/types/session';

type SessionFormModalProps = {
  isOpen: boolean;
  roomId: string;
  problemId: string;
  initialData?: Session | null;
  onClose: () => void;
  onSuccess: (session: Session) => void;
};

function ModalDialog({
  onClose,
  isLoading,
  children,
}: {
  onClose: () => void;
  isLoading: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl animate-pop-in">
        <button
          type="button"
          onClick={isLoading ? undefined : onClose}
          disabled={isLoading}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:bg-black/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          <XMarkIcon className="size-6" />
        </button>
        {children}
      </div>
    </div>
  );
}

type FormContentProps = {
  isEditing: boolean;
  isLoading: boolean;
  error: { message: string } | null;
  form: ReturnType<typeof useForm<SessionFormValues>>;
  onSubmit: (e: FormEvent) => void;
};

function SessionFormContent({ isEditing, isLoading, error, form, onSubmit }: FormContentProps) {
  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-4">
      <h2 id="session-form-title" className="text-center text-xl font-bold text-brand-900">
        {isEditing ? 'Editar Sessão' : 'Criar Sessão'}
      </h2>
      {error && <Alert tone="error">{error.message}</Alert>}
      <TextField
        label="Título da Sessão"
        placeholder="Sessão"
        value={form.values.titulo}
        onChange={(v) => form.setValue('titulo', v)}
        error={form.errors.titulo}
        autoFocus
      />
      <TextField
        label="Descrição da Sessão"
        placeholder="Primeira sessão"
        value={form.values.descricao}
        onChange={(v) => form.setValue('descricao', v)}
        error={form.errors.descricao}
      />
      <TextField
        label="Data da Sessão"
        type="date"
        placeholder="dd/mm/aaaa"
        value={form.values.data}
        onChange={(v) => form.setValue('data', v)}
        error={form.errors.data}
      />
      <Button type="submit" isLoading={isLoading} className="mt-4">
        {isEditing ? 'Salvar alterações' : 'Criar sessão'}
      </Button>
    </form>
  );
}

function syncFormValues(
  setValue: (field: keyof SessionFormValues, val: string) => void,
  data?: Session | null,
) {
  setValue('titulo', data?.titulo || '');
  setValue('descricao', data?.descricao || '');
  setValue('data', data?.data || '');
}

function buildSessionPayload(values: SessionFormValues) {
  return {
    titulo: values.titulo.trim(),
    descricao: values.descricao.trim() || null,
    data: values.data,
  };
}

// Hook extraído para enxugar a função principal
function useSessionSubmit(
  roomId: string,
  problemId: string,
  initialData: Session | null | undefined,
  onSuccess: (session: Session) => void,
) {
  const isEditing = Boolean(initialData);
  const { setValue, ...form } = useForm(
    {
      titulo: initialData?.titulo || '',
      descricao: initialData?.descricao || '',
      data: initialData?.data || '',
    },
    validateSessionForm,
  );

  const { run, isLoading, error, clearError } = useAsyncAction(async () => {
    const payload = buildSessionPayload(form.values);
    const result = isEditing
      ? await sessionService.update(roomId, problemId, initialData!.id, payload)
      : await sessionService.create(roomId, problemId, payload);
    onSuccess(result);
  });

  return { isEditing, form: { setValue, ...form }, run, isLoading, error, clearError, setValue };
}

export function SessionFormModal({
  isOpen,
  roomId,
  problemId,
  initialData,
  onClose,
  onSuccess,
}: SessionFormModalProps) {
  const { isEditing, form, run, isLoading, error, clearError, setValue } = useSessionSubmit(
    roomId,
    problemId,
    initialData,
    onSuccess,
  );

  useEffect(() => {
    syncFormValues(setValue, isOpen ? initialData : null);
    if (!isOpen) clearError();
  }, [isOpen, initialData, clearError, setValue]);

  if (!isOpen) return null;

  return (
    <ModalDialog onClose={onClose} isLoading={isLoading}>
      <SessionFormContent
        isEditing={isEditing}
        isLoading={isLoading}
        error={error}
        form={form}
        onSubmit={(e) => {
          e.preventDefault();
          if (form.validateAll()) run();
        }}
      />
    </ModalDialog>
  );
}
