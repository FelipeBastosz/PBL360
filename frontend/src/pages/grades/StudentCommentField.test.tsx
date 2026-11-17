import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StudentCommentField } from './StudentCommentField';

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

describe('StudentCommentField', () => {
  it('renders field label, template selector and character counter', () => {
    render(<StudentCommentField value="Texto teste" onChange={vi.fn()} disabled={false} />);

    expect(screen.getByLabelText(/comentário de feedback/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /usar modelo/i })).toBeInTheDocument();
    expect(screen.getByText('11 / 2000')).toBeInTheDocument();
  });

  it('triggers onChange on user typing', async () => {
    const onChange = vi.fn();
    render(<StudentCommentField value="" onChange={onChange} disabled={false} />);

    const textarea = screen.getByLabelText(/comentário de feedback/i);
    await userEvent.type(textarea, 'Feedback individual.');

    expect(onChange).toHaveBeenCalled();
  });

  it('concatenates template with existing comment when a template is chosen', async () => {
    const onChange = vi.fn();
    render(
      <StudentCommentField value="Comentário já existente." onChange={onChange} disabled={false} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));
    await userEvent.click(screen.getByRole('button', { name: /Boa participação e engajamento/i }));

    expect(onChange).toHaveBeenCalledWith(
      'Comentário já existente.\n\nDemonstrou participação ativa durante a sessão tutorial.',
    );
  });

  it('inserts template directly when comment field is empty', async () => {
    const onChange = vi.fn();
    render(<StudentCommentField value="" onChange={onChange} disabled={false} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));
    await userEvent.click(screen.getByRole('button', { name: /Boa participação e engajamento/i }));

    expect(onChange).toHaveBeenCalledWith(
      'Demonstrou participação ativa durante a sessão tutorial.',
    );
  });

  it('displays character counter in red and visual warning when limit of 2000 is exceeded', () => {
    const longValue = 'x'.repeat(2010);
    render(<StudentCommentField value={longValue} onChange={vi.fn()} disabled={false} />);

    expect(
      screen.getByText(/O feedback ultrapassa o limite de 2000 caracteres \(2010\/2000\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText('2010 / 2000')).toHaveClass('text-danger');
  });

  it('renders validation error message if error prop is provided', () => {
    render(
      <StudentCommentField
        value=""
        onChange={vi.fn()}
        error="O comentário de feedback é obrigatório."
        disabled={false}
      />,
    );

    expect(screen.getByText('O comentário de feedback é obrigatório.')).toBeInTheDocument();
  });

  it('disables input and template selector when disabled is true', () => {
    render(<StudentCommentField value="" onChange={vi.fn()} disabled={true} />);

    expect(screen.getByLabelText(/comentário de feedback/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /usar modelo/i })).toBeDisabled();
  });
});
