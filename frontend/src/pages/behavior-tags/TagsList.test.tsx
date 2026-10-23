import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { BehaviorTag } from '@/types/observation';
import { TagsList } from './TagsList';

const mockTags: BehaviorTag[] = [
  { id: 't1', nome: 'Liderou o grupo' },
  { id: 't2', nome: 'Boa participação' },
];

describe('TagsList', () => {
  it('renders spinner when loading', () => {
    const { container } = render(
      <TagsList tags={[]} query="" isLoading={true} onRename={vi.fn()} onDeleteRequest={vi.fn()} />,
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders empty message when list is empty', () => {
    render(
      <TagsList
        tags={[]}
        query=""
        isLoading={false}
        onRename={vi.fn()}
        onDeleteRequest={vi.fn()}
      />,
    );
    expect(screen.getByText('Você ainda não possui marcações personalizadas.')).toBeInTheDocument();
  });

  it('renders tags and triggers actions', async () => {
    const onDelete = vi.fn();
    render(
      <TagsList
        tags={mockTags}
        query=""
        isLoading={false}
        onRename={vi.fn()}
        onDeleteRequest={onDelete}
      />,
    );

    expect(screen.getByText('Liderou o grupo')).toBeInTheDocument();
    const deleteBtn = screen.getByRole('button', { name: 'Excluir marcação Liderou o grupo' });
    await userEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(mockTags[0]);
  });
});
