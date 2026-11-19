import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionGeneralEvaluationTextarea } from './SessionGeneralEvaluationTextarea';

describe('SessionGeneralEvaluationTextarea', () => {
  it('renders label with asterisk, placeholder and counter', () => {
    render(
      <SessionGeneralEvaluationTextarea
        value="Texto de exemplo"
        onChange={vi.fn()}
        error={null}
        disabled={false}
      />,
    );

    expect(screen.getByLabelText(/Comentário Geral/)).toBeInTheDocument();
    expect(screen.getByText('16 / 2000')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        'Digite o parecer e considerações gerais sobre a turma nesta sessão...',
      ),
    ).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SessionGeneralEvaluationTextarea
        value=""
        onChange={onChange}
        error={null}
        disabled={false}
      />,
    );

    const textarea = screen.getByLabelText(/Comentário Geral/);
    await user.type(textarea, 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('displays error and sets aria-invalid when error message provided', () => {
    render(
      <SessionGeneralEvaluationTextarea
        value=""
        onChange={vi.fn()}
        error="Campo obrigatório"
        disabled={false}
      />,
    );

    const textarea = screen.getByLabelText(/Comentário Geral/);
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });

  it('disables textarea when disabled prop is true', () => {
    render(
      <SessionGeneralEvaluationTextarea value="" onChange={vi.fn()} error={null} disabled={true} />,
    );

    expect(screen.getByLabelText(/Comentário Geral/)).toBeDisabled();
  });
});
