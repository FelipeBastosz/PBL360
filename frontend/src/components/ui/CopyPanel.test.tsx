import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopyPanel } from './CopyPanel';

describe('CopyPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('copies the item value to the clipboard when pressed', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<CopyPanel items={[{ label: 'Código', value: 'EXA854-TP02' }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Copiar código' }));

    expect(writeText).toHaveBeenCalledWith('EXA854-TP02');
  });

  it('renders one row per item', () => {
    render(
      <CopyPanel
        items={[
          { label: 'Código', value: 'EXA854-TP02' },
          { label: 'Link', value: 'pbl360.app/EXA854-TP02' },
        ]}
      />,
    );

    expect(screen.getByText('Código: EXA854-TP02')).toBeInTheDocument();
    expect(screen.getByText('Link: pbl360.app/EXA854-TP02')).toBeInTheDocument();
  });
});
