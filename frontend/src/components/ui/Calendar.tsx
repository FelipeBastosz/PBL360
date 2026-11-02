import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { todayParts, type DateParts } from '@/utils/date';
import {
  buildMonthGrid,
  formatLongDate,
  formatMonthTitle,
  isSameDay,
  shiftMonth,
  WEEKDAYS,
  type CalendarDay,
  type CalendarMonth,
} from '@/utils/calendar';

type CalendarProps = {
  selected: DateParts | null;
  onSelect: (date: DateParts) => void;
  today?: DateParts;
};

const NAV_BUTTON_CLASS =
  'rounded-full p-1.5 text-ink/70 transition-colors hover:bg-black/5 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-brand-900';

function CalendarHeader({
  month,
  onShift,
}: {
  month: CalendarMonth;
  onShift: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pb-2">
      <button
        type="button"
        onClick={() => onShift(-1)}
        aria-label="Mês anterior"
        className={NAV_BUTTON_CLASS}
      >
        <ChevronLeftIcon className="size-5" aria-hidden />
      </button>
      <p aria-live="polite" className="text-sm font-semibold capitalize text-brand-900">
        {formatMonthTitle(month)}
      </p>
      <button
        type="button"
        onClick={() => onShift(1)}
        aria-label="Próximo mês"
        className={NAV_BUTTON_CLASS}
      >
        <ChevronRightIcon className="size-5" aria-hidden />
      </button>
    </div>
  );
}

type DayButtonProps = {
  day: CalendarDay;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (date: DateParts) => void;
};

function DayButton({ day, isSelected, isToday, onSelect }: DayButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect({ day: day.day, month: day.month, year: day.year })}
      aria-label={formatLongDate(day)}
      aria-pressed={isSelected}
      aria-current={isToday ? 'date' : undefined}
      className={cn(
        'mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand-900',
        day.inMonth ? 'text-ink' : 'text-placeholder',
        isToday && !isSelected && 'font-bold text-brand-900 ring-1 ring-brand-300',
        isSelected ? 'bg-brand-900 font-semibold text-white' : 'hover:bg-brand-50',
      )}
    >
      {day.day}
    </button>
  );
}

/** Month calendar in Brazilian Portuguese, independent of the browser language. */
export function Calendar({ selected, onSelect, today = todayParts() }: CalendarProps) {
  const [visible, setVisible] = useState<CalendarMonth>(() => {
    const start = selected ?? today;
    return { month: start.month, year: start.year };
  });

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-lg animate-slide-down">
      <CalendarHeader
        month={visible}
        onShift={(delta) => setVisible((m) => shiftMonth(m, delta))}
      />
      <div aria-hidden className="grid grid-cols-7 pb-1 text-center text-xs font-medium text-muted">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday.name} title={weekday.name}>
            {weekday.short}
          </span>
        ))}
      </div>
      <div role="group" aria-label={formatMonthTitle(visible)} className="grid grid-cols-7 gap-y-1">
        {buildMonthGrid(visible).map((day) => (
          <DayButton
            key={`${day.year}-${day.month}-${day.day}`}
            day={day}
            isSelected={isSameDay(day, selected)}
            isToday={isSameDay(day, today)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
