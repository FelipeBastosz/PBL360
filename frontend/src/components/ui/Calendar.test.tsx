import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Calendar } from './Calendar';

const today = { day: 10, month: 10, year: 2026 };

describe('Calendar', () => {
  it('opens on the month of the selected date, in Portuguese', () => {
    render(
      <Calendar selected={{ day: 15, month: 3, year: 2026 }} onSelect={vi.fn()} today={today} />,
    );

    expect(screen.getByText('março de 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '15 de março de 2026' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('opens on the current month and marks today when nothing is selected', () => {
    render(<Calendar selected={null} onSelect={vi.fn()} today={today} />);

    expect(screen.getByText('outubro de 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10 de outubro de 2026' })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('moves between months', async () => {
    const user = userEvent.setup();
    render(<Calendar selected={null} onSelect={vi.fn()} today={today} />);

    await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByText('novembro de 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mês anterior' }));
    await user.click(screen.getByRole('button', { name: 'Mês anterior' }));
    expect(screen.getByText('setembro de 2026')).toBeInTheDocument();
  });

  it('returns the chosen day', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Calendar selected={null} onSelect={onSelect} today={today} />);

    await user.click(screen.getByRole('button', { name: '21 de outubro de 2026' }));

    expect(onSelect).toHaveBeenCalledWith({ day: 21, month: 10, year: 2026 });
  });
});
