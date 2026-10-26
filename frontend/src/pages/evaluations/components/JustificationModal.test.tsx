import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JustificationModal } from './JustificationModal';

describe('JustificationModal', () => {
  it('is a labelled dialog that closes on Escape', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<JustificationModal isOpen isLoading={false} onConfirm={vi.fn()} onCancel={onCancel} />);

    expect(screen.getByRole('dialog', { name: 'Justificativa da alteração' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('ignores Escape while the evaluation is being sent', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<JustificationModal isOpen isLoading onConfirm={vi.fn()} onCancel={onCancel} />);

    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });
});
