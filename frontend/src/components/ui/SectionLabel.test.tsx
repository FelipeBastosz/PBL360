import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionLabel } from './SectionLabel';

describe('SectionLabel', () => {
  it('appends the count after the label', () => {
    render(<SectionLabel label="Minhas turmas" count={2} />);

    expect(screen.getByText('Minhas turmas · 2')).toBeInTheDocument();
  });

  it('omits the separator when there is no count', () => {
    render(<SectionLabel label="Minhas turmas" />);

    expect(screen.getByText('Minhas turmas')).toBeInTheDocument();
  });
});
