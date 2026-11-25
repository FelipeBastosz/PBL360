import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { usePolling } from '@/hooks/usePolling';
import { conversationService } from '@/services/conversation.service';
import type { ChatMessage, MessagesPage } from '@/types/conversation';
import { mergeMessages } from '@/utils/chat';

const POLL_INTERVAL_MS = 4_000;

type History = { messages: ChatMessage[]; nextCursor: string | null; isReady: boolean };

const EMPTY_HISTORY: History = { messages: [], nextCursor: null, isReady: false };

// Messages that arrived meanwhile (a send right after the conversation was created) stay.
const withLatest = (page: MessagesPage) => (history: History) => ({
  messages: mergeMessages(page.itens, history.messages),
  nextCursor: page.proximoCursor,
  isReady: true,
});

const withOlder = (page: MessagesPage) => (history: History) => ({
  ...history,
  messages: mergeMessages(page.itens, history.messages),
  nextCursor: page.proximoCursor,
});

export function useMessageHistory(conversationId: string | null) {
  const [history, setHistory] = useState<History>(EMPTY_HISTORY);
  const latest = useAsyncAction(conversationService.listMessages);
  const { run: fetchOlder, isLoading: isLoadingOlder } = useAsyncAction(
    conversationService.listMessages,
  );
  // Polling failures stay silent: the next tick retries.
  const { run: fetchNewer } = useAsyncAction(conversationService.listMessages);
  const { run: fetchLatest } = latest;
  const lastId = history.messages.at(-1)?.id;

  useEffect(() => {
    if (!conversationId) return;
    fetchLatest(conversationId).then((r) => r.ok && setHistory(withLatest(r.data)));
  }, [conversationId, fetchLatest]);

  const append = useCallback((incoming: ChatMessage[]) => {
    setHistory((current) => ({ ...current, messages: mergeMessages(current.messages, incoming) }));
  }, []);

  const pollNewer = useCallback(() => {
    if (!conversationId) return;
    fetchNewer(conversationId, lastId ? { apos: lastId } : {}).then(
      (r) => r.ok && append(r.data.itens),
    );
  }, [conversationId, lastId, fetchNewer, append]);

  usePolling(pollNewer, POLL_INTERVAL_MS, history.isReady);

  // Scrolling fires many events before the loading state renders; one request per page.
  const requestedCursor = useRef<string | null>(null);

  const loadOlder = useCallback(() => {
    const cursor = history.nextCursor;
    if (!conversationId || !cursor || requestedCursor.current === cursor) return;
    requestedCursor.current = cursor;
    fetchOlder(conversationId, { cursor }).then((r) => {
      if (r.ok) setHistory(withOlder(r.data));
      else requestedCursor.current = null;
    });
  }, [conversationId, history.nextCursor, fetchOlder]);

  return {
    messages: history.messages,
    isLoading: conversationId !== null && !history.isReady && !latest.error,
    error: latest.error,
    hasOlder: history.nextCursor !== null,
    isLoadingOlder,
    loadOlder,
    append,
  };
}
