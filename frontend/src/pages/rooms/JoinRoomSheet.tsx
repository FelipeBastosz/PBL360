import type { FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { TextField } from '@/components/ui/TextField';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { roomService } from '@/services/room.service';
import {
  type JoinRoomRequest,
  toJoinRoomRequest,
  validateJoinRoomForm,
} from '@/utils/joinRoomForm';

type JoinRoomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onJoined: () => void;
};

function joinRoom(request: JoinRoomRequest) {
  return request.kind === 'code'
    ? roomService.joinByCode({ codigoSala: request.codigoSala })
    : roomService.joinByLink({ link: request.link });
}

// Mounted only while the sheet is open, so every opening starts with an empty form.
function JoinRoomForm({ onJoined }: { onJoined: () => void }) {
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
    onJoined();
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
        hint="Digite o código ou cole o link fornecido pelo professor para entrar na turma"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={form.values.codigo}
        onChange={(value) => form.setValue('codigo', value)}
        error={form.errors.codigo}
      />
      <Button type="submit" isLoading={isLoading}>
        Ir para a turma
      </Button>
    </form>
  );
}

export function JoinRoomSheet({ isOpen, onClose, onJoined }: JoinRoomSheetProps) {
  return (
    <Sheet isOpen={isOpen} title="Entrar na turma" onClose={onClose}>
      <JoinRoomForm onJoined={onJoined} />
    </Sheet>
  );
}
