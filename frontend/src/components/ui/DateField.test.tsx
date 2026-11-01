import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DateField } from './DateField';

function ControlledDateField({ initial = '', onChange = vi.fn() }) {
  const [value, setValue] = useState(initial);
  return (
    <DateField
      label="Data"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('DateField', () => {
  it('renders as a text field with the DD/MM/AAAA placeholder', () => {
    render(<ControlledDateField />);

    const input = screen.getByLabelText('Data');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'DD/MM/AAAA');
  });

  it('shows the value in DD/MM/AAAA without changing it', () => {
    render(<ControlledDateField initial="05/03/2026" />);

    expect(screen.getByLabelText('Data')).toHaveValue('05/03/2026');
  });

  it('formats the digits as the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledDateField onChange={onChange} />);

    await user.type(screen.getByLabelText('Data'), '15102026');

    expect(screen.getByLabelText('Data')).toHaveValue('15/10/2026');
    expect(onChange).toHaveBeenLastCalledWith('15/10/2026');
  });

  it('fills the field from the calendar and closes it', async () => {
    const user = userEvent.setup();
    render(<ControlledDateField initial="15/10/2026" />);

    await user.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    expect(screen.getByText('outubro de 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '20 de outubro de 2026' }));

    expect(screen.getByLabelText('Data')).toHaveValue('20/10/2026');
    expect(screen.queryByText('outubro de 2026')).not.toBeInTheDocument();
  });

  it('closes the calendar on Escape without letting the key reach the page', async () => {
    const user = userEvent.setup();
    const onWindowKey = vi.fn();
    window.addEventListener('keydown', onWindowKey);
    render(<ControlledDateField initial="15/10/2026" />);

    await user.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByText('outubro de 2026')).not.toBeInTheDocument();
    expect(onWindowKey).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }));
    window.removeEventListener('keydown', onWindowKey);
  });

  it('shows the validation error', () => {
    render(<DateField label="Data" value="" onChange={vi.fn()} error="Data inválida." />);

    expect(screen.getByLabelText('Data')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Data inválida.')).toBeInTheDocument();
  });
});
