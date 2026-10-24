import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowShell } from '@/components/layout/FlowShell';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { Alert } from '@/components/ui/Alert';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from '@/hooks/useForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import type { Discipline } from '@/types/discipline';
import { validateCreateRoomForm, type CreateRoomFormValues } from '@/utils/roomsForm';
import { ROUTES } from '@/routes/paths';
import { useDisciplines } from './hooks/useDisciplines';

function toSelectOptions(disciplines: Discipline[]) {
  return [
    ...disciplines.map((d) => ({ value: d.id, label: `${d.codigo} - ${d.nome}` })),
    { value: 'outra', label: 'Outra disciplina...' },
  ];
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
  disciplines: Discipline[];
  selectedDisciplineId: string;
  onSelectDiscipline: (id: string) => void;
  form: ReturnType<typeof useForm<CreateRoomFormValues>>;
  isCustom: boolean;
};

function DisciplineCodeFields({
  disciplines,
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
        options={toSelectOptions(disciplines)}
        error={isCustom ? undefined : form.errors.codigo}
      />
      {isCustom && (
        <div className="animate-slide-down">
          <TextField
            label="Código da Disciplina"
            placeholder="ex.: ABC123"
            value={form.values.codigo}
            onChange={(v) => form.setValue('codigo', v)}
            error={form.errors.codigo}
          />
        </div>
      )}
    </>
  );
}

function CreateRoomFields(props: CreateRoomFieldsProps) {
  const { form, isCustom } = props;

  return (
    <>
      <DisciplineCodeFields {...props} />
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

function FormError({ message }: { message: string }) {
  return (
    <div className="animate-shake">
      <Alert tone="error">{message}</Alert>
    </div>
  );
}

function CreateRoomForm() {
  const navigate = useNavigate();
  const { disciplines, error: disciplinesError } = useDisciplines();
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
    const found = disciplines.find((d) => d.id === id);
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
    <form onSubmit={handleSubmit} className="stagger-in flex flex-col gap-5">
      {error && <FormError message={error.message} />}
      {disciplinesError && <FormError message={disciplinesError.message} />}
      <CreateRoomFields
        disciplines={disciplines}
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
  const { user } = useAuth();

  return (
    <FlowShell
      title="Criar turma"
      subtitle="Dados da disciplina"
      backTo={ROUTES.rooms}
      trailing={<UserMenuButton user={user} />}
    >
      <CreateRoomForm />
    </FlowShell>
  );
}
