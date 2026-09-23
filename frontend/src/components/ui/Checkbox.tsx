import type { ReactNode } from 'react';

type CheckboxProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
};

export function Checkbox({ id, checked, onChange, children }: CheckboxProps) {
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 w-4 h-4 accent-brand-500"
      />
      <label htmlFor={id} className="text-xs text-gray-500">
        {children}
      </label>
    </div>
  );
}
