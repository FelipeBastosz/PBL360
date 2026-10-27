import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

type FeedbackEmptyStateProps = {
  message?: string;
};

export function FeedbackEmptyState({
  message = 'Seu tutor ainda não enviou feedback para esta sessão',
}: FeedbackEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center shadow-sm">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface text-muted mb-3">
        <ChatBubbleBottomCenterTextIcon className="size-6" aria-hidden />
      </span>
      <p className="text-sm font-medium text-ink/80 max-w-xs">{message}</p>
    </div>
  );
}
