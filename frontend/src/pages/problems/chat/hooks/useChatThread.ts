import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { conversationService } from '@/services/conversation.service';
import type { ChatContact } from '@/utils/chat';
import { useMessageHistory } from './useMessageHistory';

type ChatThreadOptions = {
  roomId: string;
  contact: ChatContact;
  onSeen: (conversationId: string, sentAt: string) => void;
  onActivity: () => void;
};

// The conversation is only created on the first message, so browsing the list of students
// does not leave empty conversations behind.
export function useChatThread({ roomId, contact, onSeen, onActivity }: ChatThreadOptions) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const conversationId = contact.conversation?.id ?? createdId;
  const history = useMessageHistory(conversationId);
  const { run: openConversation, error: openError } = useAsyncAction(conversationService.open);
  const {
    run: sendMessage,
    error: sendError,
    isLoading: isSending,
  } = useAsyncAction(conversationService.send);
  const lastMessage = history.messages.at(-1);
  const { append } = history;

  useEffect(() => {
    if (conversationId && lastMessage) onSeen(conversationId, lastMessage.enviadaEm);
  }, [conversationId, lastMessage, onSeen]);

  const resolveConversationId = useCallback(async () => {
    if (conversationId) return conversationId;
    const opened = await openConversation(roomId, { destinatarioId: contact.id });
    if (!opened.ok) return null;
    setCreatedId(opened.data.id);
    return opened.data.id;
  }, [conversationId, openConversation, roomId, contact.id]);

  const send = useCallback(
    async (texto: string) => {
      const targetId = await resolveConversationId();
      if (!targetId) return false;
      const sent = await sendMessage(targetId, { texto });
      if (sent.ok) {
        append([sent.data]);
        onActivity();
      }
      return sent.ok;
    },
    [resolveConversationId, sendMessage, append, onActivity],
  );

  return { ...history, send, isSending, sendError: sendError ?? openError };
}
