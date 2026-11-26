import { ArrowDownIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiError } from '@/services/apiError';
import type { ChatMessage } from '@/types/conversation';
import { useChatScroll } from '../hooks/useChatScroll';
import { ChatMessageBubble } from './ChatMessageBubble';

type ChatMessageListProps = {
  messages: ChatMessage[];
  currentUserId: string;
  recipientName: string;
  isLoading: boolean;
  error: ApiError | null;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
};

function OlderMessagesLoader() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
      <span
        role="status"
        className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-[0_4px_12px_-6px_rgb(16_33_76/0.4)]"
      >
        <Spinner className="size-3.5" />
        Carregando mensagens anteriores
      </span>
    </div>
  );
}

type MessagesContentProps = Pick<
  ChatMessageListProps,
  'messages' | 'currentUserId' | 'recipientName'
>;

function MessagesContent({ messages, currentUserId, recipientName }: MessagesContentProps) {
  if (messages.length === 0) {
    return (
      <p className="m-auto max-w-xs text-center text-sm text-muted">
        Nenhuma mensagem ainda. Envie a primeira para {recipientName}.
      </p>
    );
  }
  return (
    <ol
      aria-label={`Mensagens com ${recipientName}`}
      aria-live="polite"
      className="flex flex-col gap-3"
    >
      {messages.map((message) => (
        <ChatMessageBubble
          key={message.id}
          message={message}
          isMine={message.remetente.id === currentUserId}
        />
      ))}
    </ol>
  );
}

function NewMessagesButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-900 px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgb(0_0_119/0.6)] animate-pop-in hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900"
    >
      <ArrowDownIcon className="size-4" aria-hidden />
      Novas mensagens
    </button>
  );
}

type MessagesScrollerProps = Omit<ChatMessageListProps, 'isLoading' | 'error'>;

function MessagesScroller({
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  ...content
}: MessagesScrollerProps) {
  const { scrollRef, handleScroll, scrollToBottom, hasNewBelow } = useChatScroll(
    content.messages,
    content.currentUserId,
    { hasOlder, isLoadingOlder, onLoadOlder },
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 lg:px-6"
      >
        <MessagesContent {...content} />
      </div>
      {isLoadingOlder && <OlderMessagesLoader />}
      {hasNewBelow && <NewMessagesButton onClick={scrollToBottom} />}
    </div>
  );
}

export function ChatMessageList({ isLoading, error, ...scroller }: ChatMessageListProps) {
  if (error) {
    return (
      <Alert tone="error" className="m-4">
        {error.message}
      </Alert>
    );
  }
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-7 text-brand-900" label="Carregando mensagens" />
      </div>
    );
  }
  return <MessagesScroller {...scroller} />;
}
