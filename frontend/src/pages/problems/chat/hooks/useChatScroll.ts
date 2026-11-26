import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/types/conversation';
import { describeListChange, isNearBottom, isNearTop } from '@/utils/chat';

type Snapshot = { firstId?: string; lastId?: string; scrollHeight: number };

type OlderMessages = { hasOlder: boolean; isLoadingOlder: boolean; onLoadOlder: () => void };

// The list only moves on its own when the conversation opens or the user sends a message.
// Older messages loaded at the top keep the reading position, and a received message never
// pulls the view: it raises `hasNewBelow` while it sits out of sight. Reaching the top loads
// the previous page, so the history unfolds as the reader scrolls up.
export function useChatScroll(
  messages: ChatMessage[],
  currentUserId: string,
  { hasOlder, isLoadingOlder, onLoadOlder }: OlderMessages,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const snapshot = useRef<Snapshot>({ scrollHeight: 0 });
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const firstId = messages[0]?.id;
  const last = messages.at(-1);
  const isLastMine = last?.remetente.id === currentUserId;

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return undefined;
    const before = snapshot.current;
    const change = describeListChange(before, { firstId, lastId: last?.id });
    if (change === 'older') container.scrollTop += container.scrollHeight - before.scrollHeight;
    if (change === 'initial' || (change === 'newer' && isLastMine)) {
      container.scrollTop = container.scrollHeight;
    }
    snapshot.current = { firstId, lastId: last?.id, scrollHeight: container.scrollHeight };
    if (change !== 'newer') return undefined;
    // Measured on the next frame, once the new bubble has its final size.
    const frame = requestAnimationFrame(() => setHasNewBelow(!isNearBottom(container)));
    return () => cancelAnimationFrame(frame);
  }, [firstId, last?.id, isLastMine]);

  // A first page too short to scroll could never reach the top, so it asks for more by itself.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !hasOlder || isLoadingOlder) return undefined;
    const frame = requestAnimationFrame(() => {
      if (container.scrollHeight <= container.clientHeight) onLoadOlder();
    });
    return () => cancelAnimationFrame(frame);
  }, [firstId, hasOlder, isLoadingOlder, onLoadOlder]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    snapshot.current.scrollHeight = container.scrollHeight;
    if (isNearBottom(container)) setHasNewBelow(false);
    if (hasOlder && !isLoadingOlder && isNearTop(container)) onLoadOlder();
  }, [hasOlder, isLoadingOlder, onLoadOlder]);

  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
    setHasNewBelow(false);
  }, []);

  return { scrollRef, handleScroll, scrollToBottom, hasNewBelow };
}
