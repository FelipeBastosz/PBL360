import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FlowBrand } from '@/components/layout/FlowBrand';
import { FlowShell } from '@/components/layout/FlowShell';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import { ROUTES } from '@/routes/paths';
import {
  type JoinRoomRequest,
  toJoinRoomRequest,
  validateJoinRoomForm,
} from '@/utils/joinRoomForm';

function joinRoom(request: JoinRoomRequest) {
  return request.kind === 'code'
    ? roomService.joinByCode({ codigoSala: request.codigoSala })
    : roomService.joinByLink({ link: request.link });
}

function JoinRoomForm() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const form = useForm({ codigo: '' }, validateJoinRoomForm);
  const { run, isLoading, error } = useAsyncAction(joinRoom);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = toJoinRoomRequest(form.values.codigo);
    if (!form.validateAll() || !request) return;
    const result = await run(request);
    if (!result.ok) return;
    notify({ tone: 'success', message: 'Pronto! Você entrou na turma.' });
    navigate(ROUTES.rooms, { replace: true });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="animate-shake">
          <Alert tone="error">{error.message}</Alert>
        </div>
      )}
      <TextField
        label="Código da Turma"
        placeholder="ex.: aB7kP2x9"
        hint="Digite o código fornecido pelo professor para entrar na turma"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={form.values.codigo}
        onChange={(value) => form.setValue('codigo', value)}
        error={form.errors.codigo}
        autoFocus
      />
      <Button type="submit" isLoading={isLoading} className="mt-8">
        Ir para a turma
      </Button>
    </form>
  );
}

export default function JoinRoomPage() {
  const { user } = useAuth();

  // Only students can join rooms; the API answers 403 to anyone else.
  if (user?.tipo !== 'ALUNO') return <Navigate to={ROUTES.rooms} replace />;

  return (
    <FlowShell title="Entrar na turma" backTo={ROUTES.rooms} trailing={<UserAvatar user={user} />}>
      <FlowBrand />
      <JoinRoomForm />
    </FlowShell>
  );
}
