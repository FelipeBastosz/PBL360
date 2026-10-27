import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateTagForm } from './CreateTagForm';

describe('CreateTagForm', () => {
  it('renders initial button and opens form on click', async () => {
    render(<CreateTagForm onCreate={vi.fn()} />);

    const openBtn = screen.getByRole('button', { name: /criar nova marcação/i });
    expect(openBtn).toBeInTheDocument();

    await userEvent.click(openBtn);
    expect(screen.getByPlaceholderText('Nome da marcação')).toBeInTheDocument();
  });

  it('submits trimmed name and resets state', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CreateTagForm onCreate={onCreate} />);

    await userEvent.click(screen.getByRole('button', { name: /criar nova marcação/i }));
    const input = screen.getByPlaceholderText('Nome da marcação');
    await userEvent.type(input, '  Iniciativa  ');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onCreate).toHaveBeenCalledWith('Iniciativa');
    expect(screen.queryByPlaceholderText('Nome da marcação')).not.toBeInTheDocument();
  });

  it('resets input value when canceled', async () => {
    render(<CreateTagForm onCreate={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /criar nova marcação/i }));
    const input = screen.getByPlaceholderText('Nome da marcação');
    await userEvent.type(input, 'Texto cancelado');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await userEvent.click(screen.getByRole('button', { name: /criar nova marcação/i }));
    expect(screen.getByPlaceholderText('Nome da marcação')).toHaveValue('');
  });
});
