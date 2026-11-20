import { useEffect, useRef } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiError } from '@/services/apiError';
import type { ChatMessage } from '@/types/conversation';
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

function OlderMessagesButton({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="self-center rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand-900"
    >
      {isLoading ? 'Carregando…' : 'Carregar mensagens anteriores'}
    </button>
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

export function ChatMessageList(props: ChatMessageListProps) {
  const { messages, currentUserId, recipientName, isLoading, error } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  // Follows the conversation down when a message arrives; loading older ones keeps the view.
  useEffect(() => {
    const container = scrollRef.current;
    if (container && lastId) container.scrollTop = container.scrollHeight;
  }, [lastId]);

  if (error)
    return (
      <Alert tone="error" className="m-4">
        {error.message}
      </Alert>
    );
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-7 text-brand-900" label="Carregando mensagens" />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 lg:px-6"
    >
      {props.hasOlder && (
        <OlderMessagesButton isLoading={props.isLoadingOlder} onClick={props.onLoadOlder} />
      )}
      <MessagesContent
        messages={messages}
        currentUserId={currentUserId}
        recipientName={recipientName}
      />
    </div>
  );
}
