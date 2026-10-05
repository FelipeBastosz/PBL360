import { useEffect, useRef, type MouseEvent, type PointerEvent, type RefObject } from 'react';

export type DragPoint = { x: number; y: number };

export type PointerGestureOptions = {
  onLongPress?: () => void;
  onDragStart?: (point: DragPoint) => void;
  onDragMove?: (point: DragPoint) => void;
  onDrop?: (dropTarget: string | null) => void;
};

const LONG_PRESS_MS = 500;
const DRAG_THRESHOLD_PX = 8;

type Press = { x: number; y: number; dragging: boolean; timer: number | undefined };

type GestureContext = {
  options: RefObject<PointerGestureOptions>;
  press: RefObject<Press | null>;
  suppressClick: RefObject<boolean>;
};

export function dropTargetAt(point: DragPoint): string | null {
  const element = document.elementFromPoint?.(point.x, point.y);
  return element?.closest<HTMLElement>('[data-drop]')?.dataset.drop ?? null;
}

function finishPress(context: GestureContext) {
  window.clearTimeout(context.press.current?.timer);
  context.press.current = null;
}

function startPress(context: GestureContext, event: PointerEvent<HTMLElement>) {
  if (event.button !== 0) return;
  context.suppressClick.current = false;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  const timer = context.options.current.onLongPress
    ? window.setTimeout(() => {
        context.suppressClick.current = true;
        context.options.current.onLongPress?.();
        finishPress(context);
      }, LONG_PRESS_MS)
    : undefined;
  context.press.current = { x: event.clientX, y: event.clientY, dragging: false, timer };
}

function movePress(context: GestureContext, event: PointerEvent<HTMLElement>) {
  const current = context.press.current;
  const options = context.options.current;
  if (!current || !options.onDrop) return;
  const point = { x: event.clientX, y: event.clientY };
  if (
    !current.dragging &&
    Math.hypot(point.x - current.x, point.y - current.y) > DRAG_THRESHOLD_PX
  ) {
    window.clearTimeout(current.timer);
    current.dragging = true;
    options.onDragStart?.(point);
  }
  if (current.dragging) options.onDragMove?.(point);
}

function endPress(context: GestureContext, point: DragPoint | null) {
  if (context.press.current?.dragging) {
    context.suppressClick.current = true;
    context.options.current.onDrop?.(point ? dropTargetAt(point) : null);
  }
  finishPress(context);
}

function cancelClickAfterGesture(context: GestureContext, event: MouseEvent<HTMLElement>) {
  if (!context.suppressClick.current) return;
  context.suppressClick.current = false;
  event.preventDefault();
  event.stopPropagation();
}

export function usePointerGesture(options: PointerGestureOptions) {
  const optionsRef = useRef(options);
  const press = useRef<Press | null>(null);
  const suppressClick = useRef(false);
  const context: GestureContext = { options: optionsRef, press, suppressClick };

  useEffect(() => {
    optionsRef.current = options;
  });

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => startPress(context, event),
    onPointerMove: (event: PointerEvent<HTMLElement>) => movePress(context, event),
    onPointerUp: (event: PointerEvent<HTMLElement>) =>
      endPress(context, { x: event.clientX, y: event.clientY }),
    onPointerCancel: () => endPress(context, null),
    onClickCapture: (event: MouseEvent<HTMLElement>) => cancelClickAfterGesture(context, event),
    onContextMenu: (event: MouseEvent<HTMLElement>) => event.preventDefault(),
  };
}
