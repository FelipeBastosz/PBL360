import { type FormEvent, useEffect, type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Alert } from '@/components/ui/Alert';
import { useForm } from '@/hooks/useForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { problemService } from '@/services/problem.service';
import { validateProblemForm } from '@/utils/problemForms';
import type { Problem } from '@/types/problem';

type ProblemFormModalProps = {
  isOpen: boolean;
  roomId: string;
  initialData?: Problem | null;
  onClose: () => void;
  onSuccess: (problem: Problem) => void;
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
      aria-labelledby="problem-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
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
  form: ReturnType<typeof useForm<{ titulo: string }>>;
  onSubmit: (e: FormEvent) => void;
};

function ProblemFormContent({ isEditing, isLoading, error, form, onSubmit }: FormContentProps) {
  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-5">
      <h2 id="problem-form-title" className="text-center text-xl font-bold text-brand-900">
        {isEditing ? 'Editar Problema' : 'Criar Problema'}
      </h2>
      {error && <Alert tone="error">{error.message}</Alert>}
      <TextField
        label="Título do Problema"
        placeholder="Ex: Problema 1"
        value={form.values.titulo}
        onChange={(v) => form.setValue('titulo', v)}
        error={form.errors.titulo}
        autoFocus
      />
      <Button type="submit" isLoading={isLoading} className="mt-2">
        {isEditing ? 'Salvar alterações' : 'Criar Problema'}
      </Button>
    </form>
  );
}

export function ProblemFormModal({
  isOpen,
  roomId,
  initialData,
  onClose,
  onSuccess,
}: ProblemFormModalProps) {
  const isEditing = Boolean(initialData);
  const form = useForm({ titulo: initialData?.titulo || '' }, validateProblemForm);
  const { setValue } = form;

  const { run, isLoading, error, clearError } = useAsyncAction(async () => {
    const payload = { title: form.values.titulo.trim() };

    const result = isEditing
      ? await problemService.update(roomId, initialData!.id, payload)
      : await problemService.create(roomId, { titulo: form.values.titulo.trim() });

    onSuccess(result);
  });

  useEffect(() => {
    if (isOpen) {
      setValue('titulo', initialData?.titulo || '');
    } else {
      setValue('titulo', '');
      clearError();
    }
  }, [isOpen, initialData, clearError, setValue]);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.validateAll()) run();
  }

  return (
    <ModalDialog onClose={onClose} isLoading={isLoading}>
      <ProblemFormContent
        isEditing={isEditing}
        isLoading={isLoading}
        error={error}
        form={form}
        onSubmit={handleSubmit}
      />
    </ModalDialog>
  );
}
