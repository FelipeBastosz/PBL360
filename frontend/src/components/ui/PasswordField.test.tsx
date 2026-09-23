import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('hides the password until the user asks to show it', async () => {
    render(<PasswordField label="Senha" value="segredo123" onChange={vi.fn()} />);
    const input = screen.getByLabelText('Senha');

    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('announces the validation error', () => {
    render(<PasswordField label="Senha" value="" onChange={vi.fn()} error="Informe sua senha." />);

    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription('Informe sua senha.');
    expect(screen.getByLabelText('Senha')).toBeInvalid();
  });
});
