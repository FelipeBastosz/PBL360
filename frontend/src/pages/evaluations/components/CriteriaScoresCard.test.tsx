import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CriteriaScoresCard } from './CriteriaScoresCard';

const mockCriteria = [
  { id: 'crit-1', nome: 'Comunicação', peso: 2, ordem: 1, notaMaxima: 10 },
  { id: 'crit-2', nome: 'Pontualidade', peso: 3, ordem: 2, notaMaxima: 10 },
];

describe('CriteriaScoresCard', () => {
  it('renders student name and calculates weighted criteria average when no role is assigned', () => {
    render(
      <CriteriaScoresCard
        studentName="João Silva"
        criteria={mockCriteria}
        scores={{ 'crit-1': 8, 'crit-2': 6 }}
        onScoreChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Notas do aluno: João Silva')).toBeInTheDocument();
    expect(screen.queryByText(/Papel:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Desempenho como/)).not.toBeInTheDocument();
    // (8*2 + 6*3) / 5 = 6.8
    expect(screen.getByText('6.8')).toBeInTheDocument();
  });

  it('displays role badge and role score row when student has a role', () => {
    render(
      <CriteriaScoresCard
        studentName="Maria Santos"
        papel="COORDENADOR"
        criteria={mockCriteria}
        scores={{ 'crit-1': 8, 'crit-2': 6 }}
        notaCargo={10}
        onScoreChange={vi.fn()}
        onCargoScoreChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Papel: Coordenador')).toBeInTheDocument();
    expect(screen.getByText('Desempenho como Coordenador')).toBeInTheDocument();
    expect(screen.getByText('Peso na fórmula (30%)')).toBeInTheDocument();
    // Criteria avg: 6.8. Cargo: 10. Formula 70/30: (6.8*70 + 10*30) / 100 = 7.76 -> 7.8
    expect(screen.getByText('7.8')).toBeInTheDocument();
  });

  it('displays custom formula percentage and computes score with custom weights', () => {
    render(
      <CriteriaScoresCard
        studentName="Carlos Lima"
        papel="SECRETARIO_QUADRO"
        formula={{ criteriaWeight: 60, roleWeight: 40 }}
        criteria={mockCriteria}
        scores={{ 'crit-1': 8, 'crit-2': 6 }}
        notaCargo={10}
        onScoreChange={vi.fn()}
        onCargoScoreChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Papel: Secretário de Quadro')).toBeInTheDocument();
    expect(screen.getByText('Desempenho como Secretário de Quadro')).toBeInTheDocument();
    expect(screen.getByText('Peso na fórmula (40%)')).toBeInTheDocument();
    // Criteria avg: 6.8. Cargo: 10. Formula 60/40: (6.8*60 + 10*40) / 100 = 8.08 -> 8.1
    expect(screen.getByText('8.1')).toBeInTheDocument();
  });

  it('calls onCargoScoreChange when role score buttons are clicked', async () => {
    const user = userEvent.setup();
    const handleCargoChange = vi.fn();

    render(
      <CriteriaScoresCard
        studentName="Maria Santos"
        papel="COORDENADOR"
        criteria={mockCriteria}
        scores={{ 'crit-1': 8, 'crit-2': 6 }}
        notaCargo={5}
        onScoreChange={vi.fn()}
        onCargoScoreChange={handleCargoChange}
      />,
    );

    const increaseBtn = screen.getByRole('button', {
      name: 'Aumentar nota de Desempenho como Coordenador',
    });
    await user.click(increaseBtn);
    expect(handleCargoChange).toHaveBeenCalledWith(6);
  });
});
