import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EvaluationFeedbackCard } from './EvaluationFeedbackCard';

vi.mock('@/hooks/useFeedbackTemplates', () => ({
  useFeedbackTemplates: () => ({
    templates: [
      {
        id: 'tmpl-1',
        titulo: 'Boa participação e engajamento',
        texto: 'Demonstrou participação ativa durante a sessão tutorial.',
      },
    ],
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

describe('EvaluationFeedbackCard', () => {
  it('renders feedback section heading, selector and counter', () => {
    render(<EvaluationFeedbackCard feedback="Texto inicial" onChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Feedback' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /usar modelo/i })).toBeInTheDocument();
    expect(screen.getByText('13/2000')).toBeInTheDocument();
  });

  it('allows manual text input triggering onChange', async () => {
    const onChange = vi.fn();
    render(<EvaluationFeedbackCard feedback="" onChange={onChange} />);

    const textarea = screen.getByPlaceholderText('Escreva aqui um feedback para o(a) aluno(a)...');
    await userEvent.type(textarea, 'Muito participativo');

    expect(onChange).toHaveBeenCalled();
  });

  it('concatenates selected template to current feedback text', async () => {
    const onChange = vi.fn();
    render(<EvaluationFeedbackCard feedback="Observação prévia." onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));
    await userEvent.click(screen.getByRole('button', { name: /Boa participação e engajamento/i }));

    expect(onChange).toHaveBeenCalledWith(
      'Observação prévia.\n\nDemonstrou participação ativa durante a sessão tutorial.',
    );
  });

  it('inserts template directly when current feedback is empty', async () => {
    const onChange = vi.fn();
    render(<EvaluationFeedbackCard feedback="" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));
    await userEvent.click(screen.getByRole('button', { name: /Boa participação e engajamento/i }));

    expect(onChange).toHaveBeenCalledWith(
      'Demonstrou participação ativa durante a sessão tutorial.',
    );
  });

  it('displays warning alert when feedback exceeds 2000 characters', () => {
    const longFeedback = 'a'.repeat(2005);
    render(<EvaluationFeedbackCard feedback={longFeedback} onChange={vi.fn()} />);

    expect(
      screen.getByText(/O feedback ultrapassa o limite de 2000 caracteres \(2005\/2000\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText('2005/2000')).toHaveClass('text-danger');
  });

  it('disables textarea and selector when disabled prop is true', () => {
    render(<EvaluationFeedbackCard feedback="" onChange={vi.fn()} disabled />);

    expect(
      screen.getByPlaceholderText('Escreva aqui um feedback para o(a) aluno(a)...'),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /usar modelo/i })).toBeDisabled();
  });
});
