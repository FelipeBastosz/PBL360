import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from '@/hooks/useForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { validateCreateRoomForm, type CreateRoomFormValues } from '@/utils/roomsForm';
import { ROUTES } from '@/routes/paths';

const MOCK_DISCIPLINES = [
  { id: '1', codigo: 'EXA863', nome: 'MI Progamação' },
  { id: '2', codigo: 'TEC502', nome: 'MI Concorrência e Conectividade' },
];

const selectOptions = [
  ...MOCK_DISCIPLINES.map((d) => ({ value: d.id, label: `${d.codigo} - ${d.nome}` })),
  { value: 'outra', label: 'Outra disciplina...' },
];

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function CreateRoomHeader() {
  const { user } = useAuth();
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4">
      <div className="flex items-center gap-2 text-white">
        <Link to={ROUTES.rooms} aria-label="Voltar" className="rounded-md p-1 hover:bg-white/10">
          <ChevronLeftIcon className="size-6" aria-hidden />
        </Link>
        <h1 className="text-lg font-semibold">Criar turma</h1>
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900">
        {getInitials(user?.nome)}
      </div>
    </header>
  );
}

function CreateRoomActions({ isLoading, onCancel }: { isLoading: boolean; onCancel: () => void }) {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <p className="text-center text-sm text-brand-300">
        O código e o link de acesso da turma serão gerados automaticamente após a criação, para que
        os alunos possam entrar.
      </p>
      <Button type="submit" isLoading={isLoading}>
        Criar turma
      </Button>
      <Button variant="link" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}

type CreateRoomFieldsProps = {
  selectedDisciplineId: string;
  onSelectDiscipline: (id: string) => void;
  form: ReturnType<typeof useForm<CreateRoomFormValues>>;
  isCustom: boolean;
};

function CreateRoomFields({
  selectedDisciplineId,
  onSelectDiscipline,
  form,
  isCustom,
}: CreateRoomFieldsProps) {
  return (
    <>
      <SelectField
        label="Código"
        value={selectedDisciplineId}
        onChange={onSelectDiscipline}
        options={selectOptions}
        error={isCustom ? undefined : form.errors.codigo}
      />
      {isCustom && (
        <TextField
          label="Código da Disciplina"
          placeholder="ex.: ABC123"
          value={form.values.codigo}
          onChange={(v) => form.setValue('codigo', v)}
          error={form.errors.codigo}
        />
      )}
      <TextField
        label="Nome da Disciplina"
        value={form.values.disciplina}
        onChange={(v) => form.setValue('disciplina', v)}
        disabled={!isCustom}
        error={form.errors.disciplina}
      />
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
    </>
  );
}

function CreateRoomForm() {
  const navigate = useNavigate();
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('');
  const form = useForm(
    { codigo: '', disciplina: '', turma: '', semestre: '' },
    validateCreateRoomForm,
  );
  const isCustom = selectedDisciplineId === 'outra';

  const { run, isLoading, error } = useAsyncAction(async () => {
    const payload = {
      nome: `${form.values.disciplina.trim()} - ${form.values.turma.trim()}`,
      codigoDisciplina: form.values.codigo.trim().toUpperCase(),
      semestre: form.values.semestre.trim(),
    };
    const newRoom = await roomService.create(payload);
    navigate(ROUTES.createRoomSuccess, { state: { room: newRoom } });
  });

  function handleDisciplineSelect(id: string) {
    setSelectedDisciplineId(id);
    if (id === 'outra') {
      form.setValue('codigo', '');
      form.setValue('disciplina', '');
      return;
    }
    const found = MOCK_DISCIPLINES.find((d) => d.id === id);
    if (found) {
      form.setValue('codigo', found.codigo);
      form.setValue('disciplina', found.nome);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (form.validateAll()) run();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 pb-12 bg-surface">
      {error && <Alert tone="error">{error.message}</Alert>}
      <CreateRoomFields
        selectedDisciplineId={selectedDisciplineId}
        onSelectDiscipline={handleDisciplineSelect}
        form={form}
        isCustom={isCustom}
      />
      <CreateRoomActions isLoading={isLoading} onCancel={() => navigate(-1)} />
    </form>
  );
}

export default function CreateRoomPage() {
  return (
    <div className="min-h-dvh bg-surface">
      <CreateRoomHeader />
      <main className="mx-auto w-full max-w-md">
        <CreateRoomForm />
      </main>
    </div>
  );
}
