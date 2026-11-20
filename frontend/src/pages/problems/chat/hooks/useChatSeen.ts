import { useCallback, useState } from 'react';
import { isLaterThan, type SeenMap } from '@/utils/chat';

// The API has no read receipts yet, so the last message seen in each conversation is kept
// per user in this browser. It drives the "new message" dot on the chat button and list.
const storageKey = (userId: string) => `pbl360:chat-seen:${userId}`;

function readSeen(userId: string | undefined): SeenMap {
  if (!userId) return {};
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(userId)) ?? '{}') as unknown;
    return typeof stored === 'object' && stored !== null ? (stored as SeenMap) : {};
  } catch {
    return {};
  }
}

function writeSeen(userId: string | undefined, seen: SeenMap) {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(seen));
  } catch {
    // Storage may be full or blocked; the dot then only lasts for this visit.
  }
}

export function useChatSeen(userId: string | undefined) {
  const [seen, setSeen] = useState<SeenMap>(() => readSeen(userId));

  const markSeen = useCallback(
    (conversationId: string, sentAt: string) => {
      setSeen((current) => {
        if (!isLaterThan(sentAt, current[conversationId])) return current;
        const next = { ...current, [conversationId]: sentAt };
        writeSeen(userId, next);
        return next;
      });
    },
    [userId],
  );

  return { seen, markSeen };
}
