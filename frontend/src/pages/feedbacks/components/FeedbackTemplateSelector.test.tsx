import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackTemplateSelector } from './FeedbackTemplateSelector';

const mockFetchTemplates = vi.fn();

vi.mock('@/hooks/useFeedbackTemplates', () => ({
  useFeedbackTemplates: () => ({
    templates: [],
    isLoading: false,
    error: null,
    fetchTemplates: mockFetchTemplates,
    reload: mockFetchTemplates,
  }),
}));

describe('FeedbackTemplateSelector', () => {
  const mockTemplates = [
    {
      id: 'tmpl-1',
      titulo: 'Boa participação e engajamento',
      texto: 'Demonstrou participação ativa durante a sessão tutorial.',
    },
    {
      id: 'tmpl-2',
      titulo: 'Necessidade de aprofundar argumentos',
      texto: 'Participou das discussões, porém recomenda-se aprofundar argumentos.',
    },
  ];

  it('renders trigger button and does not show dialog initially', () => {
    render(<FeedbackTemplateSelector onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /usar modelo/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('respects disabled prop on trigger button', () => {
    render(<FeedbackTemplateSelector onSelect={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: /usar modelo/i })).toBeDisabled();
  });

  it('opens dialog displaying template titles and previews on click', async () => {
    render(<FeedbackTemplateSelector onSelect={vi.fn()} templates={mockTemplates} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));

    const dialog = screen.getByRole('dialog', { name: 'Modelos de feedback' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Boa participação e engajamento')).toBeInTheDocument();
    expect(
      screen.getByText('Demonstrou participação ativa durante a sessão tutorial.'),
    ).toBeInTheDocument();
  });

  it('calls onSelect with template text and closes dialog when selecting a template', async () => {
    const onSelect = vi.fn();
    render(<FeedbackTemplateSelector onSelect={onSelect} templates={mockTemplates} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));
    await userEvent.click(screen.getByRole('button', { name: /Boa participação e engajamento/i }));

    expect(onSelect).toHaveBeenCalledWith(
      'Demonstrou participação ativa durante a sessão tutorial.',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes dialog without calling onSelect when clicking Cancelar', async () => {
    const onSelect = vi.fn();
    render(<FeedbackTemplateSelector onSelect={onSelect} templates={mockTemplates} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes dialog without calling onSelect when clicking the close X button', async () => {
    const onSelect = vi.fn();
    render(<FeedbackTemplateSelector onSelect={onSelect} templates={mockTemplates} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stops immediate propagation when Escape is pressed to protect parent modals', async () => {
    const parentEscapeHandler = vi.fn();
    window.addEventListener('keydown', parentEscapeHandler);

    render(<FeedbackTemplateSelector onSelect={vi.fn()} templates={mockTemplates} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(parentEscapeHandler).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    window.removeEventListener('keydown', parentEscapeHandler);
  });

  it('displays loading state when isLoading is true', async () => {
    render(<FeedbackTemplateSelector onSelect={vi.fn()} isLoading />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));

    expect(screen.getByText('Carregando modelos...')).toBeInTheDocument();
  });

  it('displays error and renders retry button when error is present', async () => {
    const onRetry = vi.fn();
    render(
      <FeedbackTemplateSelector
        onSelect={vi.fn()}
        error="Falha na conexão com o servidor."
        onRetry={onRetry}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));

    expect(screen.getByText('Falha na conexão com o servidor.')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: 'Tentar novamente' });
    expect(retryBtn).toBeInTheDocument();

    await userEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables template option and indicates limit when resulting feedback exceeds 2000 chars', async () => {
    const longFeedback = 'a'.repeat(1980);
    render(
      <FeedbackTemplateSelector
        onSelect={vi.fn()}
        templates={mockTemplates}
        currentFeedback={longFeedback}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));

    const btn1 = screen.getByRole('button', { name: /Boa participação e engajamento/i });
    expect(btn1).toBeDisabled();
    expect(screen.getAllByText('Excede limite (2000 carac.)').length).toBeGreaterThan(0);
  });

  it('renders native title attribute for full hover preview', async () => {
    render(<FeedbackTemplateSelector onSelect={vi.fn()} templates={mockTemplates} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));

    const preview = screen.getByText('Demonstrou participação ativa durante a sessão tutorial.');
    expect(preview).toHaveAttribute(
      'title',
      'Demonstrou participação ativa durante a sessão tutorial.',
    );
  });

  it('restores focus to previous active element on close', async () => {
    render(<FeedbackTemplateSelector onSelect={vi.fn()} templates={mockTemplates} />);

    const trigger = screen.getByRole('button', { name: /usar modelo/i });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(trigger);
  });
});
