import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { FAB_LEFT_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

type ChatFabProps = {
  hasUnread: boolean;
  onOpen: () => void;
};

export function ChatFab({ hasUnread, onOpen }: ChatFabProps) {
  return (
    <div className={cn(FAB_LEFT_CONTAINER_CLASS, 'z-20 pb-[env(safe-area-inset-bottom)]')}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={hasUnread ? 'Abrir conversas, há mensagens novas' : 'Abrir conversas'}
        className="relative flex size-14 items-center justify-center rounded-full border border-brand-primary-border bg-brand-primary text-brand-on-primary shadow-[0_12px_28px_-10px_var(--color-brand-shadow)] transition-[scale] duration-300 ease-out animate-pop-in [animation-delay:250ms] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        <ChatBubbleLeftRightIcon className="size-6" aria-hidden />
        {hasUnread && (
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 size-3.5 rounded-full bg-danger ring-2 ring-surface animate-pop-in"
          />
        )}
      </button>
    </div>
  );
}
