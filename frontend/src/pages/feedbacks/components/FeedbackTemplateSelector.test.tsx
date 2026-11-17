import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackTemplateSelector } from './FeedbackTemplateSelector';

vi.mock('@/hooks/useFeedbackTemplates', () => ({
  useFeedbackTemplates: () => ({
    templates: [],
    isLoading: false,
    error: null,
    reload: vi.fn(),
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

  it('closes dialog on Escape key press', async () => {
    const onSelect = vi.fn();
    render(<FeedbackTemplateSelector onSelect={onSelect} templates={mockTemplates} />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays loading state when isLoading is true', async () => {
    render(<FeedbackTemplateSelector onSelect={vi.fn()} isLoading />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));

    expect(screen.getByText('Carregando modelos...')).toBeInTheDocument();
  });

  it('displays error or empty fallback when error is provided or list is empty', async () => {
    render(<FeedbackTemplateSelector onSelect={vi.fn()} error="Falha na rede" />);

    await userEvent.click(screen.getByRole('button', { name: /usar modelo/i }));

    expect(screen.getByText('Falha na rede')).toBeInTheDocument();
  });
});
