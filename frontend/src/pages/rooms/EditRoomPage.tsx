import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { FlowShell } from '@/components/layout/FlowShell';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from '@/hooks/useForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { validateEditRoomForm, type EditRoomFormValues } from '@/utils/editRoomForm';
import { buildRoomInviteUrl } from '@/utils/urlBuilder';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import { useToast } from '@/hooks/useToast';

function parseRoomName(fullName: string) {
  const parts = fullName.split(' - ');
  if (parts.length > 1) {
    const turma = parts.pop() || '';
    return { disciplina: parts.join(' - '), turma };
  }
  return { disciplina: fullName, turma: '' };
}

function CopyField({
  label,
  value,
  displayValue,
}: {
  label: string;
  value: string;
  displayValue?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <TextField
      label={label}
      value={displayValue ?? value}
      onChange={() => {}}
      disabled
      endAdornment={
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copiar ${label}`}
          className="rounded-md p-1.5 text-brand-900 hover:bg-black/5"
        >
          {copied ? (
            <CheckIcon className="size-5 text-success" />
          ) : (
            <DocumentDuplicateIcon className="size-5" />
          )}
        </button>
      }
    />
  );
}

function EditRoomFields({
  room,
  disciplina,
  form,
}: {
  room: Room;
  disciplina: string;
  form: ReturnType<typeof useForm<EditRoomFormValues>>;
}) {
  const inviteUrl = buildRoomInviteUrl(room.codigoSala);
  const displayUrl = inviteUrl.replace(/^https?:\/\//, '');

  return (
    <div className="flex flex-col gap-5">
      <TextField
        label="Código da Disciplina"
        value={room.codigoDisciplina}
        disabled
        onChange={() => {}}
      />
      <TextField label="Nome da Disciplina" value={disciplina} disabled onChange={() => {}} />

      <TextField
        label="Turma"
        placeholder="ex.: TP01"
        value={form.values.turma}
        onChange={(v) => form.setValue('turma', v)}
        error={form.errors.turma}
      />
      <TextField
        label="Semestre"
        placeholder="ex.: 2026.2"
        value={form.values.semestre}
        onChange={(v) => form.setValue('semestre', v)}
        error={form.errors.semestre}
      />

      <div className="my-2 h-px w-full bg-black/5" />

      <CopyField label="Código de Acesso" value={room.codigoSala} />

      <CopyField label="Link de Convite" value={inviteUrl} displayValue={displayUrl} />
    </div>
  );
}

function EditRoomForm({ room }: { room: Room }) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { disciplina, turma } = parseRoomName(room.nome);

  const form = useForm({ turma, semestre: room.semestre }, validateEditRoomForm);

  const { run, isLoading, error } = useAsyncAction(async () => {
    const payload = {
      nome: `${disciplina.trim()} - ${form.values.turma.trim()}`,
      semestre: form.values.semestre.trim(),
    };
    await roomService.update(room.id, payload);
    notify({ tone: 'success', message: 'Turma atualizada com sucesso!' });
    navigate(ROUTES.manageRooms);
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.validateAll()) run();
  }

  return (
    <form onSubmit={handleSubmit} className="stagger-in flex flex-col gap-5">
      {error && (
        <div className="animate-shake">
          <Alert tone="error">{error.message}</Alert>
        </div>
      )}

      <EditRoomFields room={room} disciplina={disciplina} form={form} />

      <div className="mt-8 flex flex-col gap-4">
        <Button type="submit" isLoading={isLoading}>
          Salvar alterações
        </Button>
        <Button variant="link" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export default function EditRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);

  const { run: fetchRoom, isLoading, error } = useAsyncAction(roomService.getById);

  useEffect(() => {
    if (id)
      fetchRoom(id).then((res) => {
        if (res.ok) setRoom(res.data);
      });
  }, [id, fetchRoom]);

  return (
    <FlowShell
      title="Editar turma"
      subtitle="Dados da disciplina"
      backTo={ROUTES.manageRooms}
      trailing={<UserAvatar user={user} />}
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-8 text-brand-900" />
        </div>
      ) : error ? (
        <Alert tone="error">{error.message}</Alert>
      ) : room ? (
        <EditRoomForm room={room} />
      ) : null}
    </FlowShell>
  );
}
