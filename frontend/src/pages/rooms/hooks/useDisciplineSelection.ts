import { useState } from 'react';
import type { useForm } from '@/hooks/useForm';
import type { CreateRoomFormValues } from '@/utils/roomsForm';
import { useDisciplines } from './useDisciplines';

export const CUSTOM_DISCIPLINE = 'outra';

type CreateRoomForm = ReturnType<typeof useForm<CreateRoomFormValues>>;

export function useDisciplineSelection(form: CreateRoomForm) {
  const { disciplines, error, register } = useDisciplines();
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('');
  const isCustom = selectedDisciplineId === CUSTOM_DISCIPLINE;

  function selectDiscipline(id: string) {
    setSelectedDisciplineId(id);
    const found = disciplines.find((d) => d.id === id);
    form.setValue('codigo', found?.codigo ?? '');
    form.setValue('disciplina', found?.nome ?? '');
  }

  async function registerCustomDiscipline() {
    if (!isCustom) return;
    const created = await register({
      codigo: form.values.codigo.trim().toUpperCase(),
      nome: form.values.disciplina.trim(),
    });
    setSelectedDisciplineId(created.id);
  }

  return {
    disciplines,
    error,
    selectedDisciplineId,
    isCustom,
    selectDiscipline,
    registerCustomDiscipline,
  };
}
