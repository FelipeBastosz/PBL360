import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CriterionWeightField } from './CriterionWeightField';

describe('CriterionWeightField', () => {
  it('renders label and input with value', () => {
    render(
      <CriterionWeightField
        id="test-weight"
        label="Peso (0 a 10)"
        value="5"
        onChange={vi.fn()}
        onStep={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Peso (0 a 10)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Incrementar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrementar' })).toBeInTheDocument();
  });

  it('triggers onStep with 1 and -1 when clicking stepper buttons', async () => {
    const user = userEvent.setup();
    const handleStep = vi.fn();

    render(
      <CriterionWeightField
        id="test-weight"
        label="Peso (0 a 10)"
        value="3"
        onChange={vi.fn()}
        onStep={handleStep}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Incrementar' }));
    expect(handleStep).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: 'Decrementar' }));
    expect(handleStep).toHaveBeenCalledWith(-1);
  });

  it('calls onChange when user types into the field', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <CriterionWeightField
        id="test-weight"
        label="Peso (0 a 10)"
        value="2"
        onChange={handleChange}
        onStep={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Peso (0 a 10)');
    await user.type(input, '5');
    expect(handleChange).toHaveBeenCalled();
  });

  it('disables input and buttons when disabled prop is true', () => {
    render(
      <CriterionWeightField
        id="test-weight"
        label="Peso"
        value="4"
        disabled
        onChange={vi.fn()}
        onStep={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Peso')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Incrementar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrementar' })).toBeDisabled();
  });
});
