import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EvaluationFinalScore } from './EvaluationFinalScore';

const mockCriteria = [
  { id: '1', nome: 'Critério 1', peso: 5, ordem: 1, notaMaxima: 10 },
  { id: '2', nome: 'Critério 2', peso: 5, ordem: 2, notaMaxima: 10 },
];

describe('EvaluationFinalScore', () => {
  it('calculates weighted mean when no bonus is provided', () => {
    render(<EvaluationFinalScore criteria={mockCriteria} scores={{ '1': 8, '2': 6 }} />);

    expect(screen.getByText('7.0')).toBeInTheDocument();
  });

  it('calculates final score applying role bonus', () => {
    render(<EvaluationFinalScore criteria={mockCriteria} scores={{ '1': 8, '2': 8 }} bonus={10} />);

    expect(screen.getByText('8.5')).toBeInTheDocument();
  });
});
