import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('shows the first and last initials for a full name', () => {
    render(<Avatar name="Paulo Ferreira" />);

    expect(screen.getByRole('img', { name: 'Paulo Ferreira' })).toHaveTextContent('PF');
  });

  it('falls back to the first two letters for a single word', () => {
    render(<Avatar name="Ana" />);

    expect(screen.getByRole('img', { name: 'Ana' })).toHaveTextContent('AN');
  });
});
