import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormulaBalanceSummary } from './FormulaBalanceSummary';

describe('FormulaBalanceSummary', () => {
  it('renders container with role status and aria-live polite', () => {
    render(<FormulaBalanceSummary totalWeight={10} />);

    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('renders balanced state with checkmark icon and affirmative text when total is 10', () => {
    render(<FormulaBalanceSummary totalWeight={10} />);

    expect(screen.getByText('Soma dos pesos')).toBeInTheDocument();
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    expect(screen.getByText('Soma correta')).toBeInTheDocument();
    expect(screen.queryByText(/A soma dos pesos (ultrapassou|deve)/i)).not.toBeInTheDocument();
  });

  it('renders deficit warning when total is less than 10', () => {
    render(<FormulaBalanceSummary totalWeight={7.5} />);

    expect(screen.getByText('7,5 / 10')).toBeInTheDocument();
    expect(
      screen.getByText('A soma dos pesos deve ser exatamente 10 (atual: 7,5).'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Soma correta')).not.toBeInTheDocument();
  });

  it('renders exceeded warning when total is greater than 10', () => {
    render(<FormulaBalanceSummary totalWeight={12} />);

    expect(screen.getByText('12 / 10')).toBeInTheDocument();
    expect(screen.getByText('A soma dos pesos ultrapassou 10 (total: 12).')).toBeInTheDocument();
    expect(screen.queryByText('Soma correta')).not.toBeInTheDocument();
  });
});
