import type { SessionRole } from '@/types/session';
import { cn } from '@/utils/cn';
import { SESSION_ROLE_OPTIONS } from '@/utils/sessionRoles';

const OPTIONS: { value: SessionRole | null; label: string }[] = [
  ...SESSION_ROLE_OPTIONS.map(({ value, label }) => ({ value, label })),
  { value: null, label: 'Nenhum' },
];

type RoleOptionsProps = {
  value: SessionRole | null;
  onChange: (role: SessionRole | null) => void;
};

export function RoleOptions({ value, onChange }: RoleOptionsProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-muted">Papel desta sessão</legend>
      {OPTIONS.map((option) => {
        const isChecked = value === option.value;
        return (
          <label
            key={option.label}
            className={cn(
              'flex h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 transition-[background-color,border-color] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-900',
              isChecked
                ? 'border-warning-line bg-warning-soft text-warning'
                : 'border-black/10 text-ink hover:bg-black/5',
            )}
          >
            <input
              type="radio"
              name="papel"
              checked={isChecked}
              onChange={() => onChange(option.value)}
              className="size-5 accent-[#e8930c]"
            />
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}
