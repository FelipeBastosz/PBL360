import { useState } from 'react';
import { hasUnreadMessage } from '@/utils/chat';
import { ChatFab } from './components/ChatFab';
import { RoomChatPanel } from './components/RoomChatPanel';
import { useChatSeen } from './hooks/useChatSeen';
import { useRoomConversations } from './hooks/useRoomConversations';

type RoomChatProps = {
  roomId: string;
  isProfessor: boolean;
  currentUserId: string;
};

// Private tutor ↔ student messages of one room: the floating button and its panel.
export function RoomChat({ roomId, isProfessor, currentUserId }: RoomChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { conversations, refresh } = useRoomConversations(roomId);
  const { seen, markSeen } = useChatSeen(currentUserId);
  const hasUnread = conversations.some((item) => hasUnreadMessage(item, seen[item.id]));

  return (
    <>
      <ChatFab hasUnread={hasUnread} onOpen={() => setIsOpen(true)} />
      {isOpen && (
        <RoomChatPanel
          roomId={roomId}
          isProfessor={isProfessor}
          currentUserId={currentUserId}
          conversations={conversations}
          seen={seen}
          onSeen={markSeen}
          onActivity={refresh}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
