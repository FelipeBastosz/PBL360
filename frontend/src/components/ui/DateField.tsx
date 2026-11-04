import { type KeyboardEvent, useId, useState } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import {
  DATE_PLACEHOLDER,
  formatDateParts,
  maskDate,
  parseDisplayDate,
  type DateParts,
} from '@/utils/date';
import { Calendar } from './Calendar';
import { TextField } from './TextField';

type DateFieldProps = {
  label: string;
  /** Always DD/MM/AAAA. Convert to and from the API with `toApiDate` / `fromApiDate`. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
};

/**
 * Date input that always reads DD/MM/AAAA. A native `<input type="date">` follows the browser
 * language instead of the page, so an English browser would show MM/DD/YYYY.
 */
export function DateField({ value, onChange, disabled, ...fieldProps }: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const calendarId = useId();

  const handleSelect = (date: DateParts) => {
    onChange(formatDateParts(date));
    setIsOpen(false);
  };

  // Keeps Escape from also closing the modal that holds the field.
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !isOpen) return;
    event.stopPropagation();
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2" onKeyDown={handleKeyDown}>
      <TextField
        {...fieldProps}
        value={value}
        disabled={disabled}
        onChange={(typed) => onChange(maskDate(typed))}
        placeholder={DATE_PLACEHOLDER}
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        endAdornment={
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen((open) => !open)}
            aria-label={isOpen ? 'Fechar calendário' : 'Abrir calendário'}
            aria-expanded={isOpen}
            aria-controls={calendarId}
            className="rounded-md p-2 text-placeholder hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-brand-900 disabled:cursor-not-allowed"
          >
            <CalendarDaysIcon className="size-6" aria-hidden />
          </button>
        }
      />
      {isOpen && (
        <div id={calendarId}>
          <Calendar selected={parseDisplayDate(value)} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}
