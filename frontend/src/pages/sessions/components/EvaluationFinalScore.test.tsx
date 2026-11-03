import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EvaluationFinalScore } from './EvaluationFinalScore';

const mockCriteria = [
  { id: '1', nome: 'Critério 1', peso: 5, ordem: 1, notaMaxima: 10 },
  { id: '2', nome: 'Critério 2', peso: 5, ordem: 2, notaMaxima: 10 },
];

describe('EvaluationFinalScore', () => {
  it('calculates weighted mean when no role score is provided', () => {
    render(<EvaluationFinalScore criteria={mockCriteria} scores={{ '1': 8, '2': 6 }} />);

    expect(screen.getByText('7.0')).toBeInTheDocument();
  });

  it('calculates final score applying role formula (70/30 by default)', () => {
    // criteria average = 8.0, role = 10 -> (8.0 * 70 + 10 * 30) / 100 = 8.6
    render(
      <EvaluationFinalScore
        criteria={mockCriteria}
        scores={{ '1': 8, '2': 8 }}
        roleScore={10}
        hasRole={true}
      />,
    );

    expect(screen.getByText('8.6')).toBeInTheDocument();
  });

  it('respects custom session formula', () => {
    // criteria average = 8.0, role = 10, formula = 60/40 -> (8.0 * 60 + 10 * 40) / 100 = 8.8
    render(
      <EvaluationFinalScore
        criteria={mockCriteria}
        scores={{ '1': 8, '2': 8 }}
        roleScore={10}
        formula={{ criteriaWeight: 60, roleWeight: 40 }}
        hasRole={true}
      />,
    );

    expect(screen.getByText('8.8')).toBeInTheDocument();
  });

  it('ignores role score when student has no role', () => {
    render(
      <EvaluationFinalScore
        criteria={mockCriteria}
        scores={{ '1': 8, '2': 8 }}
        roleScore={10}
        hasRole={false}
      />,
    );

    expect(screen.getByText('8.0')).toBeInTheDocument();
  });

  it('applies role formula defaulting role score to 0 when student has role but roleScore is omitted', () => {
    // criteria average = 10.0, role = 0 -> (10.0 * 70 + 0 * 30) / 100 = 7.0
    render(
      <EvaluationFinalScore criteria={mockCriteria} scores={{ '1': 10, '2': 10 }} hasRole={true} />,
    );

    expect(screen.getByText('7.0')).toBeInTheDocument();
  });
});
