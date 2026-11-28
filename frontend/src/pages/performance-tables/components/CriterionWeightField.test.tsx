import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CriterionWeightField } from './CriterionWeightField';

describe('CriterionWeightField', () => {
  it('renders label, spinbutton attributes, and stepper buttons', () => {
    render(
      <CriterionWeightField
        id="test-weight"
        label="Peso (0 a 10)"
        value="5"
        onChange={vi.fn()}
        onStep={vi.fn()}
      />,
    );

    const input = screen.getByRole('spinbutton', { name: 'Peso (0 a 10)' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
    expect(input).toHaveAttribute('aria-valuenow', '5');
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aumentar peso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diminuir peso' })).toBeInTheDocument();
  });

  it('triggers onStep with 1 and -1 when clicking enabled stepper buttons', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Aumentar peso' }));
    expect(handleStep).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: 'Diminuir peso' }));
    expect(handleStep).toHaveBeenCalledWith(-1);
  });

  it('disables decrement button when weight is at minimum 0', () => {
    render(
      <CriterionWeightField
        id="test-weight"
        label="Peso (0 a 10)"
        value="0"
        onChange={vi.fn()}
        onStep={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Diminuir peso' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Aumentar peso' })).not.toBeDisabled();
  });

  it('disables increment button when weight is at maximum 10', () => {
    render(
      <CriterionWeightField
        id="test-weight"
        label="Peso (0 a 10)"
        value="10"
        onChange={vi.fn()}
        onStep={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Aumentar peso' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Diminuir peso' })).not.toBeDisabled();
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
    expect(screen.getByRole('button', { name: 'Aumentar peso' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Diminuir peso' })).toBeDisabled();
  });

  it('applies accessibility error attributes and renders error message with role alert', () => {
    render(
      <CriterionWeightField
        id="test-weight"
        label="Peso (0 a 10)"
        value="5"
        hasError
        errorMessage="Peso inválido"
        onChange={vi.fn()}
        onStep={vi.fn()}
      />,
    );

    const input = screen.getByRole('spinbutton', { name: 'Peso (0 a 10)' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'test-weight-error');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('id', 'test-weight-error');
    expect(alert).toHaveTextContent('Peso inválido');
  });
});
