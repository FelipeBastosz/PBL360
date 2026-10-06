import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePointerGesture, type PointerGestureOptions } from './usePointerGesture';

function Target({ onClick, ...options }: PointerGestureOptions & { onClick: () => void }) {
  const gesture = usePointerGesture(options);
  return (
    <button type="button" onClick={onClick} {...gesture}>
      Aluno
    </button>
  );
}

function setup() {
  const handlers = {
    onClick: vi.fn(),
    onLongPress: vi.fn(),
    onDragStart: vi.fn(),
    onDragMove: vi.fn(),
    onDrop: vi.fn(),
  };
  render(<Target {...handlers} />);
  return { handlers, button: screen.getByRole('button', { name: 'Aluno' }) };
}

describe('usePointerGesture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(document, 'elementFromPoint');
  });

  it('lets a quick tap through as a click', () => {
    const { handlers, button } = setup();

    fireEvent.pointerDown(button, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(button, { clientX: 10, clientY: 10 });
    fireEvent.click(button);

    expect(handlers.onClick).toHaveBeenCalledOnce();
    expect(handlers.onLongPress).not.toHaveBeenCalled();
    expect(handlers.onDrop).not.toHaveBeenCalled();
  });

  it('fires a long press after half a second and swallows the click that follows', () => {
    const { handlers, button } = setup();

    fireEvent.pointerDown(button, { button: 0, clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(button, { clientX: 10, clientY: 10 });
    fireEvent.click(button);

    expect(handlers.onLongPress).toHaveBeenCalledOnce();
    expect(handlers.onClick).not.toHaveBeenCalled();
  });

  it('drags to the drop target under the pointer instead of clicking', () => {
    const seat = document.createElement('div');
    seat.dataset.drop = 'seat-3';
    document.body.append(seat);
    Object.defineProperty(document, 'elementFromPoint', { value: () => seat, configurable: true });
    const { handlers, button } = setup();

    fireEvent.pointerDown(button, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(button, { clientX: 60, clientY: 80 });
    fireEvent.pointerUp(button, { clientX: 60, clientY: 80 });
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(600));

    expect(handlers.onDragStart).toHaveBeenCalledWith({ x: 60, y: 80 });
    expect(handlers.onDrop).toHaveBeenCalledWith('seat-3');
    expect(handlers.onLongPress).not.toHaveBeenCalled();
    expect(handlers.onClick).not.toHaveBeenCalled();
    seat.remove();
  });

  it('ignores tiny finger jitter as a tap', () => {
    const { handlers, button } = setup();

    fireEvent.pointerDown(button, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(button, { clientX: 13, clientY: 12 });
    fireEvent.pointerUp(button, { clientX: 13, clientY: 12 });
    fireEvent.click(button);

    expect(handlers.onDragStart).not.toHaveBeenCalled();
    expect(handlers.onClick).toHaveBeenCalledOnce();
  });
});
