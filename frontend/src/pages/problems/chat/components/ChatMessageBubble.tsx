import type { ChatMessage } from '@/types/conversation';
import { cn } from '@/utils/cn';
import { formatMessageTime } from '@/utils/chat';

type ChatMessageBubbleProps = {
  message: ChatMessage;
  isMine: boolean;
};

export function ChatMessageBubble({ message, isMine }: ChatMessageBubbleProps) {
  return (
    <li className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
      <p
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-[0_1px_2px_rgb(16_33_76/0.06)] lg:max-w-[70%]',
          isMine
            ? 'rounded-br-md bg-brand-900 text-white'
            : 'rounded-bl-md border border-ink/10 bg-white text-ink',
        )}
      >
        <span className="sr-only">{isMine ? 'Você' : message.remetente.nome}: </span>
        {message.texto}
      </p>
      <time dateTime={message.enviadaEm} className="mt-1 text-xs text-muted">
        {formatMessageTime(message.enviadaEm)}
      </time>
    </li>
  );
}
