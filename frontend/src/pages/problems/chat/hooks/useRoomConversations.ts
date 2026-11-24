import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { usePolling } from '@/hooks/usePolling';
import { conversationService } from '@/services/conversation.service';
import type { Conversation } from '@/types/conversation';

const REFRESH_INTERVAL_MS = 20_000;

export function useRoomConversations(roomId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { run } = useAsyncAction(conversationService.listForRoom);

  const refresh = useCallback(() => {
    if (!roomId) return;
    run(roomId).then((result) => result.ok && setConversations(result.data));
  }, [roomId, run]);

  useEffect(() => refresh(), [refresh]);
  usePolling(refresh, REFRESH_INTERVAL_MS, Boolean(roomId));

  return { conversations, refresh };
}
