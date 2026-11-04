import { DateField } from '@/components/ui/DateField';
import { TextField } from '@/components/ui/TextField';
import { maskTime, TIME_PLACEHOLDER } from '@/utils/date';
import { END_OF_DAY, type DeadlineDraft, type DeadlineErrors } from '@/utils/deadlineForm';

type DeadlineFieldsProps = {
  draft: DeadlineDraft;
  errors: DeadlineErrors;
  onChange: (draft: DeadlineDraft) => void;
};

export function DeadlineFields({ draft, errors, onChange }: DeadlineFieldsProps) {
  return (
    <div className="flex flex-col gap-3 text-left">
      <DateField
        label="Data do prazo"
        optional
        value={draft.date}
        onChange={(date) => onChange({ ...draft, date })}
        error={errors.date}
      />
      <TextField
        label="Horário"
        optional
        value={draft.time}
        onChange={(time) => onChange({ ...draft, time: maskTime(time) })}
        placeholder={TIME_PLACEHOLDER}
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        error={errors.time}
        hint={`Sem horário, o prazo vai até ${END_OF_DAY}.`}
      />
    </div>
  );
}
