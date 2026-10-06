import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

export type FabAction = {
  label: string;
  to?: string;
  onClick?: () => void;
};

type FabMenuProps = {
  label: string;
  actions: FabAction[];
};

const ACTION_CLASS =
  'rounded-full border border-brand-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 shadow-[0_8px_20px_-10px_rgb(0_0_119/0.45)] transition-[background-color,scale] duration-200 animate-fade-up hover:bg-brand-50 active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-900';

function FabActionItem({
  action,
  order,
  onDone,
}: {
  action: FabAction;
  order: number;
  onDone: () => void;
}) {
  const style = { animationDuration: '260ms', animationDelay: `${order * 50}ms` };

  if (action.to) {
    return (
      <Link to={action.to} className={ACTION_CLASS} style={style} onClick={onDone}>
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={ACTION_CLASS}
      style={style}
      onClick={() => {
        onDone();
        action.onClick?.();
      }}
    >
      {action.label}
    </button>
  );
}

export function FabMenu({ label, actions }: FabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={close}
          className="fixed inset-0 z-20 cursor-default bg-ink/10 backdrop-blur-[1px] animate-fade-in"
        />
      )}
      <div className="fixed right-6 bottom-6 z-20 flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom)]">
        {isOpen && (
          <div className="flex flex-col items-end gap-2">
            {actions.map((action, index) => (
              <FabActionItem
                key={action.label}
                action={action}
                order={actions.length - 1 - index}
                onDone={close}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={label}
          aria-expanded={isOpen}
          className={cn(
            'flex size-14 items-center justify-center rounded-full text-white shadow-[0_12px_28px_-10px_rgb(0_0_119/0.7)] transition-[rotate,scale,background-color] duration-300 ease-out animate-pop-in [animation-delay:250ms] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900',
            isOpen ? 'rotate-45 bg-danger' : 'bg-brand-900',
          )}
        >
          <PlusIcon className="size-6" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </>
  );
}
