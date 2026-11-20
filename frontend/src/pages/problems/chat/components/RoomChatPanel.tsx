import { useId, useMemo, useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import type { Conversation } from '@/types/conversation';
import { cn } from '@/utils/cn';
import { buildChatContacts, type ChatContact, type SeenMap } from '@/utils/chat';
import { useChatPeople } from '../hooks/useChatPeople';
import { ChatContactsPane } from './ChatContactsPane';
import { ChatDialog } from './ChatDialog';
import { ChatThread } from './ChatThread';

type RoomChatPanelProps = {
  roomId: string;
  isProfessor: boolean;
  currentUserId: string;
  conversations: Conversation[];
  seen: SeenMap;
  onSeen: (conversationId: string, sentAt: string) => void;
  onActivity: () => void;
  onClose: () => void;
};

function NoContactSelected({ isProfessor }: { isProfessor: boolean }) {
  return (
    <div className="m-auto flex max-w-xs flex-col items-center gap-3 text-center text-muted">
      <ChatBubbleLeftRightIcon className="size-10 text-brand-300" aria-hidden />
      <p className="text-sm">
        {isProfessor ? 'Escolha um aluno para conversar.' : 'Escolha um professor para conversar.'}
      </p>
    </div>
  );
}

type ChatThreadAreaProps = Pick<
  RoomChatPanelProps,
  'roomId' | 'isProfessor' | 'currentUserId' | 'onSeen' | 'onActivity'
> & {
  contact: ChatContact | null;
  onBack: () => void;
};

function ChatThreadArea({ contact, isProfessor, ...thread }: ChatThreadAreaProps) {
  return (
    <section
      className={cn('min-w-0 flex-1 flex-col bg-surface', contact ? 'flex' : 'hidden lg:flex')}
    >
      {contact ? (
        <ChatThread key={contact.id} contact={contact} canSeePhoto={isProfessor} {...thread} />
      ) : (
        <NoContactSelected isProfessor={isProfessor} />
      )}
    </section>
  );
}

export function RoomChatPanel({
  roomId,
  isProfessor,
  currentUserId,
  conversations,
  seen,
  onSeen,
  onActivity,
  onClose,
}: RoomChatPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { people, error } = useChatPeople(roomId, isProfessor);
  const contacts = useMemo(
    () => people && buildChatContacts(people, conversations),
    [people, conversations],
  );
  const selected = contacts?.find((contact) => contact.id === selectedId) ?? null;
  const titleId = useId();

  return (
    <ChatDialog titleId={titleId} onClose={onClose}>
      <ChatContactsPane
        contacts={contacts}
        error={error}
        isProfessor={isProfessor}
        selectedId={selectedId}
        seen={seen}
        titleId={titleId}
        className={selected ? 'hidden lg:flex' : 'flex'}
        onSelect={setSelectedId}
        onClose={onClose}
      />
      <ChatThreadArea
        roomId={roomId}
        contact={selected}
        isProfessor={isProfessor}
        currentUserId={currentUserId}
        onBack={() => setSelectedId(null)}
        onSeen={onSeen}
        onActivity={onActivity}
      />
    </ChatDialog>
  );
}
